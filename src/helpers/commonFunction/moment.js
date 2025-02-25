import moment from 'moment';

export const getDateRange = (calendarType, customStartDate, customEndDate) => {
  let startDate, endDate;

  if (calendarType) {
    if (calendarType === 'week') {
      startDate = moment().startOf('isoWeek');
      endDate = moment().endOf('isoWeek');
    } else if (calendarType === 'month') {
      startDate = moment().startOf('month');
      endDate = moment().endOf('month');
    } else if (calendarType === 'year') {
      startDate = moment().startOf('year');
      endDate = moment().endOf('year');
    } else {
      throw new Error("Invalid calendar type. Use 'week', 'month', or 'year'.");
    }
  } else {
    if (!customStartDate && !customEndDate) {
      return { startDate: null, endDate: null };
    }
    if (!customStartDate && customEndDate) {
      throw new Error(
        'Custom end date cannot be selected without a start date.'
      );
    }

    if (customStartDate && !customEndDate) {
      startDate = moment(customStartDate).startOf('day');
      endDate = moment().endOf('day');
    } else {
      startDate = moment(customStartDate).startOf('day');
      endDate = moment(customEndDate).endOf('day');
    }

    if (!startDate.isValid() || !endDate.isValid()) {
      throw new Error('Invalid date format. Use YYYY-MM-DD.');
    }
  }

  return { startDate, endDate };
};
