export const DEFAULT_EXCALIDRAW_APP_STATE = {
  currentItemStrokeWidth: 0.5,
  zenModeEnabled: true,
}

export const createEmptyExcalidraw = (
  appState = DEFAULT_EXCALIDRAW_APP_STATE,
) =>
  JSON.stringify({
    type: 'excalidraw',
    version: 2,
    elements: [],
    appState,
  })
