'use strict';

(function () {
  var DATA_ROW_COUNT = 7;
  var DATA_COL_COUNT = 24;
  var DEFAULT_TIME_STR = '00:00';
  var DAY_IN_MS = 24 * 60 * 60 * 1000;
  var MS_PER_PIXEL = (60 * 60 * 1000) / 34;
  var HEAD_COL_WIDTH = document.querySelector('.chart__head-col').offsetWidth;
  var MAX_TABLE_WIDTH = DAY_IN_MS / MS_PER_PIXEL;
  var MAX_CHART_WIDTH = HEAD_COL_WIDTH + MAX_TABLE_WIDTH;
  var CELL_WIDTH = MAX_TABLE_WIDTH / DATA_COL_COUNT;
  var CELL_BORDER_WIDTH = 1;
  var DATA_CELL_COUNT = DATA_ROW_COUNT * DATA_COL_COUNT;
  var MIN_PER_HOUR = 60;



  function ScheduleHoursViewModel() {
    var me = this;

    function ScheduleHour(initWorking) {
      var me = this;
      me.working = ko.observable(initWorking);
    }

    me.startTimeStr = ko.observable(DEFAULT_TIME_STR);
    me.endTimeStr = ko.observable(DEFAULT_TIME_STR);

    me.timeDiffInPixels = ko.computed(function () {
      var diff = strToTime(me.endTimeStr()) - strToTime(me.startTimeStr());

      return (diff !== 0) ? diff / MS_PER_PIXEL : DAY_IN_MS / MS_PER_PIXEL;
    }, me);

    function strToTime(str) {
      return Date.parse('2000-01-01T' + str + ':00.000Z');
    }

    me.chartWidth = ko.computed(function () {
      var diff = me.timeDiffInPixels();
      var diffMinusBorder = diff - CELL_BORDER_WIDTH;

      return (diff >= 0) ? HEAD_COL_WIDTH + diffMinusBorder: MAX_CHART_WIDTH + diffMinusBorder;
    }, me);

    me.tableOffset = ko.computed(function () {
      var offset = -(strToTime(me.startTimeStr()) - strToTime(DEFAULT_TIME_STR)) / MS_PER_PIXEL;

      return offset;
    }, me);

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
    });

    var headCellsCopy = tableCopy.querySelectorAll('.table__cell--head');
    var prevHCells = headCells;
    var prevRightShowCell = headCells[22];

    function replaceInnerHTML(fromElem, toElem) {
      toElem.innerHTML = fromElem.innerHTML;
      fromElem.innerHTML = '';
    }

    me.endTimeStr.subscribe(function (newValue) {
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
      var minutes = getMinutes(newValue);
      if (rightShowCellIndex % 2 && minutes > 0) {
        if (minutes < 49) {
          replaceInnerHTML(hCells[rightShowCellIndex], hCells[rightShowCellIndex - 1]);
          hCells[rightShowCellIndex - 1].style.textAlign = 'right';
        }
      }
      prevHCells = hCells;
      prevRightShowCell = rightShowCell;
    });

    me.scheduleHours = ko.observableArray(new Array());

    for (var i = 0; i < DATA_CELL_COUNT; i++) {
      me.scheduleHours().push(new ScheduleHour(true));
    }

    me.invertHour = function (item) {
      item.working(!item.working());
    }

    function fillHours (working) {
      for (var i = 0; i < DATA_CELL_COUNT; i++) {
        me.scheduleHours()[i].working(working);
      }
    }

    me.fillHoursAuto = function () {
      fillHours(true);
    }

    me.clearHours = function () {
      fillHours(false);
    }
  }

  ko.applyBindings(new ScheduleHoursViewModel());
})();
