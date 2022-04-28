const TARGETS = require('../targets');
const twitterValidation = require('./twitter');

module.exports = {
    validateContent,
};

function validateContent(content, inputs, target = TARGETS.TWITTER) {
    let validationResult = { errors: [] };

    if (!content.description) {
        validationResult.errors.push(`No content description provided. Please add a ${inputs.contentDescriptionHeading} section to your issue.`);
    }

    if (target === TARGETS.TWITTER) {
        validationResult.errors.push(...twitterValidation.validate(content, inputs));
    }

    return validationResult;
}
