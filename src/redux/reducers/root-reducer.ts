import { combineReducers } from 'redux';

import exReducer from './ex-reducer';

export default combineReducers({
  exReducer: exReducer
})
