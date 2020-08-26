'use strict';

(function () {
  var getCellOpenTag = function (cellKind) {
    var classes = 'table__cell table__cell--' + cellKind;
    var dataBindAttribute = (cellKind === 'data') ? 'data-bind=click:$parent.invertHour,style:{backgroundColor:working()?&quot#0066ff&quot:&quot#dfe4ef&quot}' : '';
    return '<li class="' + classes + '"' + dataBindAttribute + '>';
  }

  var getCellMarkup = function (cellKind, cellContent) {
    return getCellOpenTag(cellKind) + cellContent + '</li>';
  }

  var chart = document.querySelector('.schedule__chart');
  var headCellsMarkup = '';
  var cellContent;

  var table = chart.querySelector('.chart__table');

  var tableCopy = table.cloneNode(true);

  var formatTime = function (timeStr) {
    var result = timeStr;
    if (Number.parseInt(timeStr, 10) <= 9) {
      result = '0' + timeStr;
    }
    return result;
  }

  for (var j = 0; j < DATA_COL_COUNT; j++) {
    cellContent = (j % 2) ? formatTime(j.toString()) + '<sup style="font-size: 9px;">00</sup>' : '';
    headCellsMarkup += getCellMarkup('head', cellContent);
  }

  var chartHead = chart.querySelector('.table__head');

  chartHead.insertAdjacentHTML('beforeend', headCellsMarkup);

  var chartBody = chart.querySelector('.table__body');

  chartBody.insertAdjacentHTML('beforeend', getCellMarkup('data', ''));

  var chartHead = tableCopy.querySelector('.table__head');

  chartHead.insertAdjacentHTML('beforeend', headCellsMarkup);

  chart.appendChild(tableCopy);

  table.setAttribute('data-bind', 'style: {marginLeft: tableOffset()}');

  chartBody = tableCopy.querySelector('.table__body');

  chartBody.insertAdjacentHTML('beforeend', getCellMarkup('data', ''));
})();
