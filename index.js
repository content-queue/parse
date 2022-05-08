'use strict';

const ScheduledDate = require('./scheduled-date');

const core = require('@actions/core'),
    github = require('@actions/github'),
    token = core.getInput('token'),
    octokit = github.getOctokit(token);

if(!github.context.payload.issue && !/\/(?:issue|pull-request)s\/\d+$/.test(github.context.payload.project_card?.content_url)) {
    core.info('Not running on an event with an associated issue.');
    return;
}

if(!ScheduledDate.isValid(core.getInput('dateFormat'), true)) {
    core.setFailed('Invalid date pattern provided.');
    return;
}

const inputs = {
    contentDescriptionHeading: core.getInput('contentDescriptionHeading'),
    contentHeading: core.getInput('contentHeading'),
    dateFormat: core.getInput('dateFormat'),
    replyToHeading: core.getInput('replyToHeading'),
    retweetHeading: core.getInput('retweetHeading'),
    scheduledTitle: core.getInput('scheduledTitle'),
    timezone: core.getInput('timezone'),
}

function getPropertyFromHeadingMapping(heading) {
    const mapping = {
        [inputs.contentDescriptionHeading]: 'description',
        [inputs.contentHeading]: 'content',
        [inputs.replyToHeading]: 'replyTo',
        [inputs.retweetHeading]: 'repost',
        [inputs.scheduledTitle]: 'scheduledDate',
    };

    return mapping[heading] ?? heading;
}

async function getIssue() {
    let { issue } = github.context.payload;
    if(!issue) {
        const issueNumber = /\/(?:issue|pull-request)s\/(\d+)$/.exec(github.context.payload.project_card?.content_url);
        const { data: result } = await octokit.rest.issues.get({
            ...github.context.repo,
            issue_number: issueNumber[1],
        });
        issue = result;
    }
    return issue;
}

async function doStuff() {
    const issue = await getIssue();
    const issueBody = issue.body || '';
    const sections = issueBody.split('###');
    const content = {};

    for(const section of sections) {
        const [ title, ...body ] = section.split('\n');
        const key = getPropertyFromHeadingMapping(title.trim());
        content[key] = body.join("\n").trim();
    }
    if(content.hasOwnProperty('scheduledDate')) {
        const scheduledDate = new ScheduledDate(content.scheduledDate, inputs.timezone, inputs.dateFormat);
        content.date = {
            timestamp: scheduledDate.getTime(),
        };
    }

    core.setOutput('cardContent', JSON.stringify(content));
}

doStuff().catch((error) => {
    console.error(error);
    core.setFailed(error.message);
});
