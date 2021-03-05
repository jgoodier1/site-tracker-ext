async function blockSite(e) {
  e.preventDefault();
  const input = document.querySelector('#block-site');
  let blockedSites = (await browser.storage.local.get('blockedSites')).blockedSites;
  if (blockedSites === undefined) blockedSites = [];
  if (blockedSites.includes(input.value)) return;
  blockedSites.push(input.value);
  browser.storage.local.set({
    blockedSites
  });
  const blockedList = document.querySelector('#blocked-list');
  // this doesn't work with firstChild
  if (blockedList.firstChild) {
    if (blockedList.children[0].textContent === 'nothing') {
      blockedList.removeChild(blockedList.children[0]);
    }
  }
  const listItem = document.createElement('li');
  listItem.textContent = input.value;
  const xButton = document.createElement('button');
  xButton.textContent = 'X';
  xButton.addEventListener('click', removeBlockedSite);
  listItem.appendChild(xButton);
  blockedList.appendChild(listItem);
  input.value = '';
}

function redirectSite(e) {
  e.preventDefault();
  const input = document.querySelector('#redirect-page');
  console.log(input.value);
  browser.storage.local.set({ redirectSite: input.value });
  input.value = '';
}

function showRedirectSite() {
  function setCurrentChoice(result) {
    document.querySelector('#redirect-page').value = result.redirectSite ?? '';
  }
  function onError(error) {
    console.log(`Error: ${error}`);
  }
  let getting = browser.storage.local.get('redirectSite');
  getting.then(setCurrentChoice, onError);
}

async function showBlockedSites() {
  const blockedSites = (await browser.storage.local.get('blockedSites')).blockedSites;
  if (blockedSites === undefined || blockedSites.length === 0) return;
  const list = document.querySelector('#blocked-list');
  while (list.firstChild) list.removeChild(list.firstChild);

  blockedSites.forEach(site => {
    const listItem = document.createElement('li');
    listItem.textContent = site;
    const xButton = document.createElement('button');
    xButton.textContent = 'X';
    xButton.addEventListener('click', removeBlockedSite);
    listItem.appendChild(xButton);
    list.appendChild(listItem);
  });
}

async function removeBlockedSite(e) {
  const blockedSite = e.target.parentNode.textContent.slice(0, -1);
  // console.log(site);
  const blockedSites = (await browser.storage.local.get('blockedSites')).blockedSites;
  const filterSites = blockedSites.filter(site => site !== blockedSite);
  browser.storage.local.set({ blockedSites: filterSites });
  const list = document.querySelector('#blocked-list');
  list.removeChild(e.target.parentNode);
}

document.addEventListener('DOMContentLoaded', showRedirectSite);
document.addEventListener('DOMContentLoaded', showBlockedSites);

document.querySelector('#block-site-form').addEventListener('submit', blockSite);
document.querySelector('#redirect-page-form').addEventListener('submit', redirectSite);
