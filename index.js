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

if(!ScheduledDate.isValid(core.getInput('dateFormat', true))) {
    core.setFailed('Invalid date pattern provided.');
    return;
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
    const sections = issue.body.split('##');
    const content = {};
    for(const section of sections) {
        const [ title, body ] = section.split('\n', 1);
        content[title.trim()] = body.trim();
    }
    if(content.hasOwnProperty(core.getInput('scheduledTitle'))) {
        const rawDate = content[core.getInput('scheduledTitle')];
        const scheduledDate = new ScheduledDate(rawDate, core.getInput('timezone'), core.getInput('dateFormat'));
        content.date = {
            timestamp: scheduledDate.getTime(),
            valid: scheduledDate.valid,
        };
    }
    core.setOutput('cardContent', JSON.stringify(content));
}

doStuff().catch((error) => core.setFailed(error.message));
