import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isSidebarOpen: boolean;
  isEventModalOpen: boolean;
  selectedDate: string; // ISO date string
  selectedEventId: string | null;
  calendarView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
  editingEventId: string | null; // non-null when editing existing event in modal
}

const initialState: UiState = {
  isSidebarOpen: false,
  isEventModalOpen: false,
  selectedDate: new Date().toISOString(),
  selectedEventId: null,
  calendarView: 'dayGridMonth',
  editingEventId: null,
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
} = uiSlice.actions;

export default uiSlice.reducer;
