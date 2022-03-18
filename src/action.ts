import core from '@actions/core';
import { writeCache } from './lib/cache';
import { getFeed } from './lib/getfeed';
import { genPayload } from './lib/payload';
import { slack } from './lib/slack';
import { validate } from './lib/validate';

const run = async () => {
  try {
    // validate inputs
    validate();

    // parse inputs
    const slackWebhook = core.getInput('slack_webhook');
    const rssFeed = core.getInput('rss');
    const cacheDir = core.getInput('cache_dir');
    const interval = core.getInput('interval').length ? parseInt(core.getInput('interval')) : undefined;
    const unfurl = core.getInput('unfurl').length ? core.getBooleanInput('unfurl') : false;
    const showDesc = core.getInput('show_desc').length ? core.getBooleanInput('show_desc') : true;
    const showLink = core.getInput('show_link').length ? core.getBooleanInput('show_link') : true;
    const showDate = core.getInput('show_date').length ? core.getBooleanInput('show_date') : true;

    // get rss feed items
    const { filtered, unfiltered, cached } = await getFeed(rssFeed, cacheDir, interval);

    if (filtered.length) {
      // generate payload
      const payload = await genPayload(filtered, unfiltered, rssFeed, unfurl, showDesc, showDate, showLink);

      // send payload to slack
      await slack(payload, slackWebhook);

      // cache data
      if (cacheDir) await writeCache(unfiltered?.title || '', rssFeed, cacheDir, filtered, cached);
    } else {
      core.info(`No new items found`);
    }
  } catch (err) {
    core.debug('Operation failed due to error');
    core.setFailed((<Error>err).message);
  }
};

(async () => {
  await run();
})();
