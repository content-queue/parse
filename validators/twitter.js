const twitter = require('twitter-text');

module.exports = {
    validate,
};

const MAX_WEIGHTED_LENGTH = 280;

function isValidTweetUrl(url) {
  return /^https?:\/\/(?:www\.)?twitter.com\/[^/]+\/status\/([0-9]+)\/?$/.test(url);
}

function validate(content, inputs) {
  const errors = [];

  if (content.hasOwnProperty('replyTo') && (!content.replyTo || !isValidTweetUrl(content.replyTo))) {
    errors.push(`The "${inputs.replyToHeading}" section needs to have content and only link a Tweet URL to reply to.`);
  }

  if (content.hasOwnProperty('repost') && (!content.repost || !isValidTweetUrl(content.repost))) {
    errors.push(`Retweets need to have a Tweet URL to retweet in the "${inputs.retweetHeading}" section.`);
  }

  if (!content.hasOwnProperty('repost') && !content.content) {
    errors.push(`Tweets need to have a "${inputs.contentHeading}" section.`);
  }

  if (content.hasOwnProperty('content')) {
    const pureTweet = content.content.replace(/!\[[^\]]*\]\(([^)]+)\)/g, '');
    const parsedTweet = twitter.parseTweet(pureTweet);
    if(parsedTweet.weightedLength > MAX_WEIGHTED_LENGTH) {
        errors.push(`Tweet content too long by ${parsedTweet.weightedLength - MAX_WEIGHTED_LENGTH} weighted characters.`);
    }
  }

  return errors;
}
