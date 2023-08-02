import {
  StackActions,
  useNavigation as useNativeNavigation,
} from '@react-navigation/native';
import { SheetRoutesContext } from '../context/SheetRoutesContext';
import { SheetActions, useCloseModal } from '../SheetsProvider';
import { nanoid } from 'nanoid/non-secure';
import { useContext } from 'react';
import { throttle, delay, isAndroid } from '../utils';
import { Keyboard } from 'react-native';

export const useNavigation = () => {
  const nav = useNativeNavigation<any>();
  const sheetRoutes = useContext(SheetRoutesContext);
  const closeModal = useCloseModal();

  const setParams = () => {};
  const setOptions = nav.setOptions;
  const reset = () => {};

  const replace = (path: string, params?: any) => {
    nav.dispatch(StackActions.replace(path, params));
  };

  const navigate = throttle((path: string, params?: any) => {
    const find = sheetRoutes.find((el) => el.path === path);
    if (find) {
      push('SheetsProvider', {
        $$action: SheetActions.ADD,
        component: find.component,
        params: params,
        path,
      });
    } else {
      nav.navigate(path, params);
    }
  }, 1000);

  const go = throttle((path: string, params?: any) => {
    nav.navigate(path, params);
  }, 1000);

  const replaceModal = async (path: string, params?: any) => {
    const find = sheetRoutes.find((el) => el.path === path);

    if (find) {
      if (isAndroid) {
        // Fix bottom sheet bug
        Keyboard.dismiss();
        await delay(100);
      }

      navigate('SheetsProvider', {
        $$action: SheetActions.REPLACE,
        component: find.component,
        params: params,
        path,
      });
    } else {
      console.warn('Not found');
    }
  };

  const push = throttle((path: string, params?: any) => {
    nav.dispatch(StackActions.push(path, params));
  }, 1000);

  const globalGoBack = () => {
    if (nav.canGoBack()) {
      nav.goBack();
    }
  };

  const goBack = () => {
    if (closeModal) {
      closeModal();
    } else {
      globalGoBack();
    }
  };

  const openModal = (path: string, params?: any) => {
    const find = sheetRoutes.find((el) => el.path === path);
    if (find) {
      push('SheetsProvider', {
        $$action: SheetActions.ADD,
        component: find.component,
        params: params,
        path,
      });
    } else {
      push(path, params);
    }
  };

  return {
    replaceModal,
    openModal,
    replace,
    globalGoBack,
    setOptions,
    setParams,
    navigate,
    goBack,
    reset,
    push,
    go,
  };
};

export const useRouter = useNavigation;
