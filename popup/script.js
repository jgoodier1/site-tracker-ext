function topSites() {
  browser.storage.local.get('results').then(stats => {
    if (!stats) return;

    const sortedResults = Object.keys(stats.results).sort(
      (a, b) => stats.results[a] <= stats.results[b]
    );

    const sitesElement = document.getElementById('sites');
    while (sitesElement.firstChild) sitesElement.removeChild(sitesElement.firstChild);

    createSitesTable(sitesElement, stats.results, sortedResults);

    unhideAndHide('top-site-panel', ['previous-days-panel', 'previous-stats-panel']);
  });
}

function previousDaysList() {
  browser.storage.local.get('previousStats').then(stats => {
    if (!stats) return;

    const sortedResults = Object.keys(stats.previousStats).sort((a, b) => a <= b);

    const daysElement = document.getElementById('days');
    while (daysElement.firstChild) days.removeChild(daysElement.firstChild);

    for (let i = 0; i < sortedResults.length; i++) {
      const tableRow = document.createElement('tr');
      const dateCell = document.createElement('td');
      dateCell.textContent = sortedResults[i];
      dateCell.id = 'table-row-click';
      dateCell.onclick = () =>
        previousDayStats(sortedResults[i], stats.previousStats[sortedResults[i]]);
      tableRow.appendChild(dateCell);
      daysElement.appendChild(tableRow);
    }

    unhideAndHide('previous-days-panel', ['top-site-panel', 'previous-stats-panel']);
  });
}

function previousDayStats(date, previousDateObject) {
  const sortedResults = Object.keys(previousDateObject).sort(
    (a, b) => previousDateObject[a] <= previousDateObject[b]
  );
  const titleElement = document.getElementById('previous-stats-title');
  titleElement.textContent = date;
  const tableElement = document.getElementById('previous-stats-table');

  while (tableElement.firstChild) tableElement.removeChild(tableElement.firstChild);

  createSitesTable(tableElement, previousDateObject, sortedResults);

  unhideAndHide('previous-stats-panel', ['previous-days-panel', 'top-site-panel']);
}

function addEnterHandler(element, handler) {
  element.addEventListener('click', e => {
    handler(e);
  });
  element.addEventListener('keydown', e => {
    if ((e.keycode = '13')) {
      e.preventDefault;
      handler(e);
    }
  });
}

function createSitesTable(table, object, array) {
  for (i = 0; i < array.length; i++) {
    const tableRow = document.createElement('tr');
    const siteName = document.createElement('td');
    const siteLink = document.createElement('a');
    siteLink.textContent = `${array[i]}: `;
    siteLink.href = `https://${array[i]}`;
    siteLink.classList.add('site-link');
    siteName.appendChild(siteLink);
    const siteCount = document.createElement('td');
    siteCount.textContent = `${object[array[i]]} time${object[array[i]] > 1 ? 's' : ''}`;
    tableRow.appendChild(siteName);
    tableRow.appendChild(siteCount);
    table.appendChild(tableRow);
  }
}

function unhideAndHide(toUnhide, toHide) {
  document.getElementById(toUnhide).classList.remove('hide');
  toHide.forEach(element => document.getElementById(element).classList.add('hide'));
}

addEnterHandler(document.getElementById('prevDays'), previousDaysList);

addEnterHandler(document.getElementById('today'), topSites);

topSites();
