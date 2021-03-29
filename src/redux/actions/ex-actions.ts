import * as types from '../constants/ActionTypes';

export const setExValue = (exValue: any) => ({
  type: 'SET_EXVALUE',
  payload: exValue
});