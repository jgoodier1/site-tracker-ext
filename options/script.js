async function blockSite(e) {
  e.preventDefault();
  const input = document.querySelector('#block-site');
  const radioButton = document.querySelector('input[name="block-options"]:checked').value;
  let blockedRE;
  if (radioButton === 'entire-site') {
    blockedRE = new RegExp(input.value, 'i');
  } else if (radioButton === 'specific-part') {
    blockedRE = new RegExp(`^[\\w-]+:/*[\\w-.]*${input.value}[/]*$`, 'i');
  } else return;

  let blockedSites = (await browser.storage.local.get('blockedSites')).blockedSites;
  if (blockedSites === undefined) blockedSites = [];
  const blockObject = {
    userString: input.value,
    regex: blockedRE,
    radioOption: radioButton
  };
  // how to do this check??
  if (blockedSites.includes(blockObject)) return;
  blockedSites.push(blockObject);
  browser.storage.local.set({
    blockedSites
  });

  // this should be it's own function
  const blockedList = document.querySelector('#blocked-list');
  // this doesn't work with firstChild
  if (blockedList.firstChild) {
    if (blockedList.children[0].textContent === 'nothing') {
      blockedList.removeChild(blockedList.children[0]);
    }
  }
  const listItem = document.createElement('li');
  listItem.textContent = `${input.value} - Blocking the ${
    radioButton === 'entire-site' ? 'entire site' : 'specific path'
  }`;
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
    listItem.textContent = `${site.userString} - Blocking the ${
      site.radioOption === 'entire-site' ? 'entire site' : 'specific path'
    }`;
    const xButton = document.createElement('button');
    xButton.textContent = 'X';
    xButton.addEventListener('click', removeBlockedSite);
    listItem.appendChild(xButton);
    list.appendChild(listItem);
  });
}

async function removeBlockedSite(e) {
  const blockedSite = e.target.parentNode.textContent.split('-')[0].trim();
  const blockedSites = (await browser.storage.local.get('blockedSites')).blockedSites;
  blockedSites.forEach(site => console.log(site.userString, blockedSite));
  const filterSites = blockedSites.filter(site => site.userString !== blockedSite);
  browser.storage.local.set({ blockedSites: filterSites });
  const list = document.querySelector('#blocked-list');
  list.removeChild(e.target.parentNode);
}

document.addEventListener('DOMContentLoaded', showRedirectSite);
document.addEventListener('DOMContentLoaded', showBlockedSites);

document.querySelector('#block-site-form').addEventListener('submit', blockSite);
document.querySelector('#redirect-page-form').addEventListener('submit', redirectSite);

document.querySelector('#reset-redirect').addEventListener('click', function () {
  browser.storage.local.remove('redirectSite');
  document.querySelector('#redirect-page').value = '';
});
