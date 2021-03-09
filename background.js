let lastHostname;

const tabURLs = [];

browser.storage.local.get('results').then(results => {
  if (results.results) results = results.results;

  browser.webNavigation.onCompleted.addListener(
    requestDetails => {
      if (requestDetails.frameId !== 0) return;
      const url = new URL(requestDetails.url);

      browser.storage.local.get('currentDate').then(storedDate => {
        /**
         * check is currentDate exists
         * if it doesn't, set it as today (should only happen when the user first install extension)
         */
        if (!storedDate.currentDate) {
          storedDate.currentDate = new Date().toLocaleDateString('en-US');
          browser.storage.local.set({ currentDate: storedDate.currentDate });
        }
        /**
         * check if storedDate is the current date
         * if it isn't, move yesterdays results into storage with yesterday's date as the name
         * change currentDate in storage to the new date, reset the results and keep going
         */
        if (storedDate.currentDate !== new Date().toLocaleDateString('en-US')) {
          browser.storage.local.get('previousStats').then(stats => {
            if (stats.previousStats) stats = stats.previousStats;
            stats[storedDate.currentDate] = results;
            results = {};

            browser.storage.local.set({
              previousStats: stats,
              currentDate: new Date().toLocaleDateString('en-US')
            });

            addToResults(url, results);
          });
        } else addToResults(url, results);
      });
    },
    {
      url: [{ schemes: ['http', 'https'] }]
    }
  );
});

/**
 * only want to update if the new hostname is different than the previous
 * (so that it can be consistent with SPAs and non-SPAs)
 * compare the current hostname with the one in the variable
 * if they're the same, return, else add one to the existing results
 * put the updated results back into storage
 */
function addToResults(url, results) {
  if (url.hostname === lastHostname) return;

  results[url.hostname] = results[url.hostname] || 0;
  results[url.hostname]++;
  lastHostname = url.hostname;

  browser.storage.local.set({ results: results });
}

function initiateTab(tabId) {
  if (tabURLs[tabId]) return;
  else tabURLs[tabId] = 'about:blank';
}

function blockSite(details) {
  initiateTab(details.tabId);
  console.log(details);
  browser.storage.local.get('blockedSites').then(results => {
    browser.storage.local.get('redirectSite').then(redirectResults => {
      const blockedSites = results.blockedSites;
      if (blockedSites === undefined) return;

      tabURLs[details.tabId] = details.url;
      function redirect() {
        let redirectSite = redirectResults.redirectSite;

        const defaultUrl = browser.runtime.getURL('blocked/index.html');
        if (redirectSite === undefined) redirectSite = defaultUrl;
        else if (redirectSite.slice(0, 4) !== 'http' && redirectSite !== 'about:blank') {
          redirectSite = `https://www.${redirectSite}/`;
        }
        browser.tabs.update(details.tabId, { url: redirectSite, loadReplace: true });
      }
      blockedSites.forEach(site => {
        const found = tabURLs[details.tabId].match(site.regex);
        console.log(tabURLs[details.tabId], site.regex, found);
        if (found !== null) redirect();
      });
    });
  });
}

browser.webRequest.onBeforeRequest.addListener(blockSite, {
  urls: ['<all_urls>'],
  types: ['main_frame']
});
