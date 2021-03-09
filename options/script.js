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

  // check if the 'not blocking anything' p exists
  const emptyListP = document.querySelector('#empty-list-p');
  if (emptyListP) emptyListP.parentNode.removeChild(emptyListP);

  const blockedList = document.querySelector('#blocked-list');
  blockedList.classList.remove('hide');
  addToTable(input.value, radioButton);

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

  // check if the 'not blocking anything' p exists
  const emptyListP = document.querySelector('#empty-list-p');
  if (emptyListP) emptyListP.parentNode.removeChild(emptyListP);

  const list = document.querySelector('#blocked-list');
  list.classList.remove('hide');

  blockedSites.forEach(site => {
    addToTable(site.userString, site.radioOption);
  });
}

function addToTable(url, specificity) {
  const tableBody = document.querySelector('#block-list-tbody');
  const tableRow = document.createElement('tr');
  tableRow.id = url;
  const siteCell = document.createElement('td');
  siteCell.textContent = url;
  tableRow.appendChild(siteCell);

  const specificityCell = document.createElement('td');
  specificityCell.textContent =
    specificity === 'entire-site' ? 'entire site' : 'specific path';
  tableRow.appendChild(specificityCell);

  const removeCell = document.createElement('td');
  const xButton = document.createElement('button');
  xButton.textContent = 'X';
  xButton.classList.add('remove-button');
  xButton.addEventListener('click', removeBlockedSite);
  removeCell.appendChild(xButton);
  tableRow.appendChild(removeCell);
  tableBody.appendChild(tableRow);
}

async function removeBlockedSite(e) {
  const blockedSite = e.target.parentNode.parentNode.id;
  const blockedSites = (await browser.storage.local.get('blockedSites')).blockedSites;
  blockedSites.forEach(site => console.log(site.userString, blockedSite));
  const filterSites = blockedSites.filter(site => site.userString !== blockedSite);
  browser.storage.local.set({ blockedSites: filterSites });

  // this is really stupid
  e.target.parentNode.parentNode.parentNode.removeChild(e.target.parentNode.parentNode);
}

document.addEventListener('DOMContentLoaded', showRedirectSite);
document.addEventListener('DOMContentLoaded', showBlockedSites);

document.querySelector('#block-site-form').addEventListener('submit', blockSite);
document.querySelector('#redirect-page-form').addEventListener('submit', redirectSite);

document.querySelector('#reset-redirect').addEventListener('click', function () {
  browser.storage.local.remove('redirectSite');
  document.querySelector('#redirect-page').value = '';
});
