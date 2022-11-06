/* eslint-disable max-len */
import React, {
  Dispatch, SetStateAction, useState, useEffect, useCallback,
} from 'react';
import {
  Calendar as ReactBigCalendar,
  luxonLocalizer,
  ToolbarProps,
  View,
} from 'react-big-calendar';
import { DateTime, Settings } from 'luxon';
import { useTranslation } from 'react-i18next';
import Router from 'next/router';
import {
  BookingStatus,
  useEventsQuery, useGetBookingsQuery,
} from '~/generated/graphql';
import {
  serializeBooking,
  serializeEvent,
} from '~/functions/calendarFunctions';
import EventView from './EventView';
import { CalendarEvent, CalendarEventType } from '~/types/CalendarEvent';
import routes from '~/routes';

export type CustomToolbarProps = {
  showEvents: boolean;
  showBookings: boolean;
  setShowEvents: Dispatch<SetStateAction<boolean>>;
  setShowBookings: Dispatch<SetStateAction<boolean>>;
} & ToolbarProps;

export enum Size {
  Small = 'sm',
  Large = 'lg',
}

type PropTypes = {
  height: string;
  CustomToolbar: React.ComponentType<CustomToolbarProps>;
  size?: Size;
  views?: View[];
};

export default function Calendar({
  height,
  CustomToolbar,
  size = Size.Large,
  views = ['month', 'week', 'day'],
}: PropTypes) {
  const [showEvents, setShowEvents] = useState(true);
  const [showBookings, setShowBookings] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [serializedEvents, setSerializedEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [startDate, setStartDate] = useState<DateTime>(DateTime.now().minus({ month: 2 }));
  const [endDate, setEndDate] = useState<DateTime>(DateTime.now().plus({ month: 2 }));
  const {
    data: eventsData,
  } = useEventsQuery({ variables: { start_datetime: startDate, end_datetime: endDate } });
  const {
    data: bookingsData,
  } = useGetBookingsQuery({ variables: { status: BookingStatus.Accepted, from: startDate, to: endDate } });

  useEffect(() => {
    if (eventsData && bookingsData) {
      setSerializedEvents([
        ...eventsData.events.events.map((event) => serializeEvent(event)),
        ...bookingsData.bookingRequests.map((booking) => serializeBooking(booking)),
      ]);
    }
  }, [eventsData, bookingsData]);

  useEffect(() => {
    if (showEvents && showBookings) {
      setFilteredEvents(serializedEvents);
    } else if (showEvents) {
      setFilteredEvents(
        serializedEvents.filter(
          (serializedEvent) => serializedEvent.type === CalendarEventType.Event,
        ),
      );
    } else if (showBookings) {
      setFilteredEvents(
        serializedEvents.filter(
          (serializedEvent) =>
            serializedEvent.type === CalendarEventType.Booking,
        ),
      );
    } else {
      setFilteredEvents([]);
    }
  }, [serializedEvents, showEvents, showBookings]);

  const { i18n } = useTranslation('common');
  Settings.defaultLocale = 'sv';
  // @ts-ignore
  const localizer = luxonLocalizer(DateTime, {
    firstDayOfWeek: 1,
  });
  const toLuxonDate = useCallback(
    (date: Date) => DateTime.fromJSDate(date).setLocale(i18n.language),
    [i18n.language],
  );

  const Toolbar = useCallback((props) => (
    <CustomToolbar
      showEvents={showEvents}
      showBookings={showBookings}
      setShowBookings={setShowBookings}
      setShowEvents={setShowEvents}
      {...props}
    />
  ), [CustomToolbar, showEvents, showBookings]);

  const Event = useCallback((props) => (
    <EventView
      selectedEventId={selectedEventId}
      setSelectedEventId={setSelectedEventId}
      {...props}
    />
  ), [selectedEventId]);

  const DateCellWrapper = useCallback(({ value }: any) => {
    const date = value as Date;
    const today = new Date();
    const isToday = `${date.getMonth()}${date.getDate()}`
      === `${today.getMonth()}${today.getDate()}`;
    return <div className={`rbc-day-bg ${isToday ? 'rbc-today' : ''}`} />;
  }, []);

  const MonthHeader = useCallback(
    ({ date }) => <div>{toLuxonDate(date).weekdayShort}</div>,
    [toLuxonDate],
  );
  const WeekHeader = useCallback(({ date }) => {
    const { weekdayShort, day, month } = toLuxonDate(date);
    return <div>{`${weekdayShort} ${day}/${month}`}</div>;
  }, [toLuxonDate]);

  return (
    <ReactBigCalendar
      views={views}
      events={filteredEvents}
      localizer={localizer}
      startAccessor="start"
      endAccessor="end"
      style={{ height }}
      components={{
        dateCellWrapper: DateCellWrapper,
        toolbar: Toolbar,
        event: Event,
        month: {
          header: MonthHeader,
        },
        week: {
          header: WeekHeader,
        },
      }}
      eventPropGetter={(event) => ({
        className: `event_${event.type}${selectedEventId === event.id ? '_selected' : ''
        } event_${size}`,
      })}
      onShowMore={() => {
        Router.push(routes.calendar);
      }}
      onDoubleClickEvent={(event) => {
        Router.push(routes.event(event.id));
      }}
      onRangeChange={(range: { start: Date, end: Date }) => {
        setStartDate(toLuxonDate(range.start));
        setEndDate(toLuxonDate(range.end));
      }}
    />
  );
}