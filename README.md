# Site Tracker Browser Extension

## Table of Contents

- [About the Project](#about-the-project)
- [Purpose and Goals](#purpose-and-goals)
- [Spotlight - Blocking](#spotlight-blocking)
  - [Current Implementation](#current-implementation)
  - [Limitations of This Implementation](#limitations-of-this-implementation)
- [Lessons Learned](#lessons-learned)
- [Future Improvements](#future-improvements)

![home page of the popup](/images/home.png)

## About the Project

"Site Tracker" is a productivity focused browser extension that keeps track of what websites you've visited and lets you block sites. The extension features a popup from the toolbar that displays the websites you've visited that day, sorted by how many times you've visited them. The idea was that if you are aware of how often you were going back to the same sites, you'd be able to control yourself better and be able to focus. The extension also stores your stats from previous days so that you can go back to compare how you've been doing. From the popup, you can access an "Options" page that lets you block sites, so if just seeing your stats doesn't motivate you to focus, you can brute force it by blocking the distracting site(s). I built this project using plain old JavaScript, HTML, and CSS. A big part of the project was learning and using the WebExtension API.

## Purpose and Goals

Since this was my second project, I know wanted to build something I could use. At the time I had just finished my first project and was having trouble focusing. I had started to work on a new project, but I wasn't very interested in it, so I had a hard time focusing, so I thought that I should build something to help me focus. There are a lot of extensions like this already that you can download, but I wanted to build it myself because an extension like this has the ability to track and record everything you do on the internet (that's kind of the point), so I didn't trust that whatever extension I installed wasn't malicious. So, I decided to build it myself.

My main tech-related goal was to learn about the WebExtension API. I had wanted to learn to build browser extensions for a while because I felt that extensions are incredibly useful and it would be a good skill to have. Also, if you're building a personal project for the web, building extensions has a lot of appeal because you can do so much. You can build productivity apps, like this one, you can build a mini website that you can access from the toolbar, like [my other extension](https://github.com/jgoodier1/unofficial-anilist-ext), you can customize and make improvements to other sites as you see fit and so much else. It's also good practice because you can use all of the same technology you use for building websites. An extension is just JavaScript, HTML, and CSS. You can even use frameworks like React. I felt like there was just so much potential here, so my goal was really just to get started building extensions.

## Spotlight – Blocking

The biggest feature of this extension is it's ability to block sites. I added the feature because I found that just tracking visits wasn't enough to keep me focused and so I decided that I wanted to force myself to focus by blocking the distracting sites. The current implementation can either block entire sites or just a subsection of them. By subsection I mean that if you blocked `reddit.com/r/example` you could still go to `reddit.com/r/something-else` or just plain `reddit.com`. You can also choose where you want to be redirected to when you go to a blocked site.

### Current Implementation

![the options page](/images/options.png)

The current implementation is pretty straightforward. The user can add sites to block on the options page, accessed by clicking "Options" in the popup. As you can see in the image above, there's an input where the user can input the site they want blocked, then they select whether they want to block the whole site, or just the section. Once the hit block, the function `blockSite` gets called in `options/script.js`. This function takes the site that the user input, and makes a regular expression out of it. The regular expression it uses depends on the scope of the blocking that the user wants. See them below:<!-- describe the regex better -->

```js
const blockedRE =
  radioButton === 'entire-site'
    ? new RegExp(input.value, 'i')
    : new RegExp(`^[\\w-]+:/*[\\w-.]*${input.value}[/]*$`, 'i');
```

After this, the site gets added to storage so that it can be blocked in `background.js` The object that gets blocked looks like this:

```js
const blockObject = {
  userString: input.value,
  regex: blockedRE,
  radioOption: radioButton
};
```

Here, the `userString` is the input as it was given. This is needed so that the blocked sites can be displayed to the user. `regex` is the regular expression shown above, and `radioOption` hold the scope of the blocking, which is also needed so that is can be displayed to the user.

The actual blocking takes place in `background.js`. The blocking is done by adding a listener that gets called before every web request. It looks like this:

```js
browser.webRequest.onBeforeRequest.addListener(blockSite, {
  urls: ['<all_urls>'],
  types: ['main_frame']
});
```

Here, `browser` is the namespace that all of the browser extension APIs live on in Firefox. In Chrome, the equivalent is `chrome`. The first argument to `addListener` is the function to be called, in this case it's `blockSite`, which I will describe in a moment. The second argument is a filter object. The `urls` array is all of the urls that you want the listener to be called on. In this case, `'<all_urls>'` means that I want it called on every url. The `types` array is that types of resources you want the listener called on. For example, options include: `font`, `image`, `script`, `stylesheet`, etc. In this case I put `main_frame`, because I only want it called when the top level document is loaded.

The `blockSite` function receives a `details` object that hold details about the request. The fields of interest to this function are `url`, and `tabId`, which is needed so that I know which tab to update. The first that the function does is get both the array of blocked sites and the site to redirect to from storage. Extensions use a slightly different storage than the local storage or session storage of plain websites. The biggest difference is that setting items into storage is asynchronous in Firefox extensions. Another difference is that you can fetch several things at once with extension storage, so what `get` returns is an object with the data you wanted. Calling storage looks like this:

```js
browser.storage.local.get(['blockedSites', 'redirectSite']).then(results => {
  const blockedSites = results.blockedSites;
  // ...
});
```

After this, all that's is left to do is iterate through the `blockedSites` array and match the current url against the regular expression for each blocked site. If a match is found, then the redirect function is called. The iteration looks like this:

```js
blockedSites.forEach(site => {
  const found = details.url.match(site.regex);
  if (found !== null) redirect();
});
```

The redirect function looks like this:

```js
function redirect() {
  const defaultUrl = browser.runtime.getURL('blocked/index.html');

  let redirectSite = results.redirectSite;
  if (redirectSite === undefined) redirectSite = defaultUrl;
  else if (redirectSite.slice(0, 4) !== 'http' && redirectSite !== 'about:blank') {
    redirectSite = `https://www.${redirectSite}/`;
  }
  browser.tabs.update(details.tabId, { url: redirectSite, loadReplace: true });
}
```

The first thing that the function does is make find the url for the default redirect page that I provide. I need to use `browser.runtime.getURL` because the url for extensions changes every time the browser is reloaded to avoid fingerprinting. In the last line, the call to `browser.tabs.update()` is what actually does the redirecting. The first argument it takes is the id of the tab to be updated. As explained above, blocked site receives this as part of the `details` parameter. The second argument is an object called`updateProperties`. The two values I'm need to set are `url` and `loadReplace`. `url` is obviously the url to redirect to and `loadReplace` replaces the previous url in the browsers history, so that if the user presses the "Back" button, they go to the redirect site.

### Limitations of This Implementation

The biggest limitation of my implementation is that it doesn't block single-page applications (SPAs), properly. SPAs are sites that only fetch one HTML document, and all updates to the page are done using JavaScript. They are build using tools such as React or Vue.js. They cause a problem here because the listener only fires when a new page is fetched, and SPAs only fetch the first one, so they can only be blocked when you first go to the site. So, for example, reddit is an SPA, so if you want to block `reddit.com/r/example`, it only blocks it when you enter that url specifically. If you go to `reddit.com` and navigate to `reddit.com/r/example`, it won't be blocked. I have a similar problem with counting visits on SPAs. I originally wanted it so that every page you visited on a site would increment the counter, but the listener only fires when pages are fetched, so it led to a discrepancy between SPAs and non-SPAs. So I only count when a user first visits the site. This is something I hope to change in the future, but it would require a lot of rewriting.

## Lessons Learned

My biggest takeaway from this project was how to effectively use and learn from documentation. For this project, the main resource I used was [MDN's Browser Extension documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions). It provided everything I needed to know to be able to build this project. It has some tutorials for building simple extensions, "how to"s for solving some common problems, such as intercepting HTTP requests. It also has extension documentation for all of the `manifest.json` keys and extension specific JavaScript APIs.

Prior to this project, whenever I ran into a problem, I would immediately Google it (if I was given an error, I would Google that error), then click through the links and hope they gave me a quick answer. Those links were often Stack Overflow questions or blog posts. I would usually jump to the answer and try to apply it to my problem. While this would sometimes work (especially when I first started and my problems were simpler), it left me not really understanding the solution, or even why I was having the problem in the first place. I would still occasionally read the documentation, but it proved difficult to use my "figure out a solution first, worry about understanding it later" approach, so I didn't like documentation.

After working on this project, I've discovered that one strength of documentation is that it helps you understand what you're using on a more fundamental level. It doesn't necessarily give you answers, but good documentation will help you get the answer for yourself. Now, I always go to documentation first, and focus on understanding the problem so that I can work toward a solution on my own. If my problem is with a library, I'll check their website or Github. If it's with JavaScript or something else built into the browser, I'll go to MDN.

## Future Improvements

It has been a while since I worked on this project, but there is still a lot I hope to improve and features I hope to add. The first thing I need to do is fix how the extension treats SPAs. I've already explained the problem above in the "Spotlight" section, so I won't go into details here. I also want to be able to track the time spent on sites. I want to add more options to blocking, such as: blocking for a specific amount of time, scheduled blocking (only certain days, between certain hours), and have the opposite of blocking, where everything except some whitelisted sites are blocked. The final feature I want to add is the ability to compare days and show trends. This was actually why I wanted to keep track of the number of visits in the first place.
