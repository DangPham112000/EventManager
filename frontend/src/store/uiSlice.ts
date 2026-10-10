import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ParticipationFilter = 'ALL' | 'JOINED' | 'INTERESTED';

// Date range FullCalendar currently shows (ISO strings, end exclusive)
export interface VisibleRange {
  start: string;
  end: string;
  viewType: string;
}

interface UiState {
  isSidebarOpen: boolean;
  isEventModalOpen: boolean;
  selectedDate: string; // ISO date string
  selectedEventId: string | null;
  calendarView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listUpcoming';
  editingEventId: string | null; // non-null when editing existing event in modal
  participationFilter: ParticipationFilter;
  visibleRange: VisibleRange | null; // for the header title
}

const initialState: UiState = {
  isSidebarOpen: false,
  isEventModalOpen: false,
  selectedDate: new Date().toISOString(),
  selectedEventId: null,
  calendarView: 'dayGridMonth',
  editingEventId: null,
  participationFilter: 'ALL',
  visibleRange: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.isSidebarOpen = action.payload;
    },
    openEventModal(state, action: PayloadAction<{ editingId?: string } | undefined>) {
      state.isEventModalOpen = true;
      state.editingEventId = action?.payload?.editingId ?? null;
    },
    closeEventModal(state) {
      state.isEventModalOpen = false;
      state.editingEventId = null;
    },
    setSelectedDate(state, action: PayloadAction<string>) {
      state.selectedDate = action.payload;
    },
    setSelectedEventId(state, action: PayloadAction<string | null>) {
      state.selectedEventId = action.payload;
    },
    setParticipationFilter(state, action: PayloadAction<ParticipationFilter>) {
      state.participationFilter = action.payload;
    },
    setVisibleRange(state, action: PayloadAction<VisibleRange>) {
      state.visibleRange = action.payload;
    },
    setCalendarView(state, action: PayloadAction<UiState['calendarView']>) {
      state.calendarView = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openEventModal,
  closeEventModal,
  setSelectedDate,
  setSelectedEventId,
  setCalendarView,
  setParticipationFilter,
  setVisibleRange,
} = uiSlice.actions;

export default uiSlice.reducer;
