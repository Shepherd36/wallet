import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import FastImage from 'react-native-fast-image';
import axios from 'axios';
import { i18n } from '$translation';
import DeviceInfo from 'react-native-device-info';

import { exchangeActions } from '$store/exchange/index';
import { withRetry } from '$store/retry';
import { ExchangeCategoryModel } from '$store/models';
import { ExchangeMethods } from '$store/exchange/interface';
import { getIsTestnet } from '$database';
import { getServerConfig } from '$shared/constants/serverConfig';
import { fiatCurrencySelector } from '$store/main';

export function* loadMethodsWorker() {
  try {
    const isTestnet = yield call(getIsTestnet);
    const currency = yield select(fiatCurrencySelector);

    const resp = yield withRetry(
      'loadMethodsWorker',
      axios.get,
      `${getServerConfig('tonkeeperEndpoint')}/fiat/methods`,
      {
        params: {
          lang: i18n.locale,
          build: DeviceInfo.getReadableVersion(),
          chainName: isTestnet ? 'testnet' : 'mainnet',
          currency,
        },
      },
    );

    const categories: ExchangeCategoryModel[] = [];
    const methods: ExchangeMethods = {};
    const images: string[] = [];
    for (let category of resp.data.data.categories) {
      if (category.items.length > 0) {
        categories.push({
          type: category?.type,
          title: category.title,
          subtitle: category.subtitle,
          items: category.items.map((item: any) => item.id),
        });

        for (const method of category.items) {
          methods[method.id] = method;
          images.push(method.icon_url);
        }
      }
    }

    FastImage.preload(images.map((uri) => ({ uri })));

    yield put(
      exchangeActions.setLoadedMethods({
        categories,
        methods,
      }),
    );
  } catch (e) {}
}

export function* exchangeSaga() {
  yield all([takeLatest(exchangeActions.loadMethods, loadMethodsWorker)]);
}
