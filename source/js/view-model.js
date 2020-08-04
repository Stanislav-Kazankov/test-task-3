'use strict';

(function () {
  var DATA_ROW_COUNT = 7;
  var DATA_COL_COUNT = 24;
  var DEFAULT_START_TIME_STR = '00:00';
  var DEFAULT_END_TIME_STR = '23:59';
  var DAY_IN_MS = 24 * 60 * 60 * 1000;
  var MS_PER_PIXEL = (60 * 60 * 1000) / 34;
  var HEAD_COL_WIDTH = document.querySelector('.chart__head-col').offsetWidth;
  var MAX_TABLE_WIDTH = DAY_IN_MS / MS_PER_PIXEL;
  var MAX_CHART_WIDTH = HEAD_COL_WIDTH + MAX_TABLE_WIDTH;
  var CELL_WIDTH = MAX_TABLE_WIDTH / DATA_COL_COUNT;
  var DATA_CELL_COUNT = DATA_ROW_COUNT * DATA_COL_COUNT;
  var MIN_PER_HOUR = 60;
  var timeFieldMask = new RegExp('\[0-2][0-3]:[0-5][0-9]');

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

  for (var j = 0; j < 24; j++) {
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

  function ScheduleHoursViewModel() {
    var me = this;

    function ScheduleHour(initWorking) {
      var me = this;
      me.working = ko.observable(initWorking);
    }

    var originalScheduleHours = new Array();

    for (var i = 0; i < DATA_CELL_COUNT; i++) {
      originalScheduleHours.push(new ScheduleHour(true));
    }

    me.startTimeStr = ko.observable(DEFAULT_START_TIME_STR);
    me.endTimeStr = ko.observable(DEFAULT_END_TIME_STR);

    me.timeDiffInPixels = ko.computed(function () {
      return (strToTime(me.endTimeStr()) - strToTime(me.startTimeStr())) / MS_PER_PIXEL;
    }, me);

    function strToTime(str) {
      return Date.parse('2000-01-01T' + str + ':00.000Z');
    }

    me.chartWidth = ko.computed(function () {
      return (me.timeDiffInPixels() >= 0) ? HEAD_COL_WIDTH + me.timeDiffInPixels() : MAX_CHART_WIDTH + me.timeDiffInPixels();
    }, me);

    me.tableOffset = ko.computed(function () {
      var offset = -(strToTime(me.startTimeStr()) - strToTime(DEFAULT_START_TIME_STR)) / MS_PER_PIXEL;

      return offset;
    }, me);

    var prevStartTimeStr = DEFAULT_START_TIME_STR;
    var headCells = table.querySelectorAll('.table__cell--head');
    var prevLeftShowCell = headCells[0];

    function getHoursStr(timeStr) {
      return timeStr.slice(0, 2);
    }

    function getMinutesStr(timeStr) {
      return timeStr.slice(3, 5);
    }

    function getMinutes(timeStr) {
      return Number.parseInt(getMinutesStr(timeStr), 10);
    }

    function writeTimeToCell(cell, timeStr) {
      cell.childNodes[0].textContent = getHoursStr(timeStr);
      cell.querySelector('sup').textContent = getMinutesStr(timeStr);
    }

    function getElemIndex(items, item) {
      return Array.from(items).indexOf(item);
    }

    function getCellIndexByTime(timeStr) {
      return Number.parseInt(getHoursStr(timeStr), 10);
    }

    me.startTimeStr.subscribe(function (newValue) {
      var processedNewValue = '';
      var i;
      for (i = 0; i < prevStartTimeStr.length; i++) {
        if (newValue[i] === prevStartTimeStr[i]) {
          processedNewValue += newValue[i];
        } else {
          break;
        }
      }
      processedNewValue += newValue[i];
      for (var j = i + 2; j < newValue.length; j++) {
        processedNewValue += newValue[j];
      }
      if (!timeFieldMask.test(processedNewValue)) {
        me.startTimeStr(prevStartTimeStr);
        return;
      }

      me.startTimeStr(processedNewValue);

      var prevLeftShowCellIndex = getElemIndex(headCells, prevLeftShowCell);
      if (prevLeftShowCellIndex % 2) {
        prevLeftShowCell.style.paddingRight = prevLeftShowCell.style.paddingLeft = '3px';
        writeTimeToCell(prevLeftShowCell, formatTime(prevLeftShowCellIndex.toString()) + ':00');
      }

      var leftShowCellIndex = getCellIndexByTime(newValue);
      var leftShowCell = headCells[leftShowCellIndex];

      if (leftShowCellIndex % 2) {
        var minutes = getMinutes(newValue);
        if (minutes > 0) {
          writeTimeToCell(leftShowCell, newValue);
        } else {
          writeTimeToCell(leftShowCell, '');
        }
        leftShowCell.style.paddingLeft = (minutes * CELL_WIDTH / MIN_PER_HOUR).toString() + 'px';
        leftShowCell.style.paddingRight = '0';
      } else {
        if (leftShowCellIndex) {
          headCells[leftShowCellIndex - 1].style.paddingLeft = '0';
        }
      }
      prevLeftShowCell = leftShowCell;
      prevStartTimeStr = newValue;
    });

    var headCellsCopy = tableCopy.querySelectorAll('.table__cell--head');
    var prevHCells = headCells;
    var prevRightShowCell = headCells[22];

    function replaceInnerHTML(fromElem, toElem) {
      toElem.innerHTML = fromElem.innerHTML;
      fromElem.innerHTML = '';
    }

    me.endTimeStr.subscribe(function (newValue) {
      if (!timeFieldMask.test()) {
        me.endTimeStr(prevEndTimeStr);
        return;
      }

      var prevRightShowCellIndex = getElemIndex(prevHCells, prevRightShowCell);
      if (prevRightShowCellIndex % 2) {
        if (prevHCells[prevRightShowCellIndex - 1].innerHTML !== '') {
          replaceInnerHTML(prevHCells[prevRightShowCellIndex - 1], prevHCells[prevRightShowCellIndex]);
          prevHCells[prevRightShowCellIndex - 1].style.textAlign = 'left';
        }
      }

      var hCells = (getCellIndexByTime(me.startTimeStr()) <= getCellIndexByTime(newValue)) ? headCells : headCellsCopy;
      var rightShowCellIndex = getCellIndexByTime(newValue);
      var rightShowCell = hCells[rightShowCellIndex];
      if (rightShowCellIndex % 2) {
        var minutes = getMinutes(newValue);
        if (minutes < 45) {
          replaceInnerHTML(hCells[rightShowCellIndex], hCells[rightShowCellIndex - 1]);
          hCells[rightShowCellIndex - 1].style.textAlign = 'right';
        }
      }
      prevHCells = hCells;
      prevRightShowCell = rightShowCell;
    });

    me.scheduleHours = ko.observableArray(originalScheduleHours);

    me.invertHour = function (item) {
      item.working(!item.working());
    }
  }

  ko.applyBindings(new ScheduleHoursViewModel());
})();
