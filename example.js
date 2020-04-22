import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Linking } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import { Actheme, Elems, Comps, actions, utils } from '@clik'
import I18n from '@i18n'

const WelcomeScreen = props => {
  const dispatch = useDispatch()
  const { userInfo, locale } = useSelector(state => ({
    userInfo: state.userReducer.userInfo,
    locale: state.localeReducer.locale
  }))

  const [countries, setCountries] = useState([])
  const [code, setCode] = useState(userInfo && userInfo.info && userInfo.info.countryCode || '+855')
  const [phone, setPhone] = useState(userInfo && userInfo.info &&  userInfo.info.phoneNumber)
  const [active, setActive] = useState()
  const [valid, setValid] = useState()
  const [ready, setReady]= useState()

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      Promise.all([AsyncStorage.getItem('@countryCode'), AsyncStorage.getItem('@phone')])
        .then(([countryCode, phoneNumber]) => {
          phoneNumber && setPhone(phoneNumber)
          countryCode && setCode(countryCode)
          setReady(true)

          let navigator

          if(url){
            const route = url.replace(/.*?:\/\//g, '');
            let [screen, params] = route.split('?');
            screen = screen.charAt(0).toUpperCase() + screen.slice(1);
            params = Object.fromEntries(params.split('&').map(item => item.split('=')));
            const { type, transactionNo, merchantId } = params;
            navigator = { screen, params: { type, transaction: { transactionNo, merchantId } } };
          }

          phoneNumber && utils.navigator.reset('ConfirmPin', {
            title: I18n.t('confirmPin'),
            message: I18n.t('pleaseEnterPin'),
            action: 'signin',
            phone: phoneNumber,
            code: countryCode,
            onDone: pin => dispatch(actions.signin(pin, phoneNumber, countryCode, navigator)),
            onCancel: () => utils.navigator.reset('Welcome')
          })
          handleCountries()
        }).catch(err => console.error('An error occurred', err));
      })
  }, [])

  if(!ready) return null

  return (
    <Comps.Layout>
      <Elems.KeyboardWrap testID="signin-screen" accessibilityLabel="signin-screen">
        <Language.Comp locale={locale} />
        <Elems.Wrap fustyle="ph:10% as:c">
          <Elems.Wrap fustyle="f:0">
            <Elems.Logo active={active} />
          </Elems.Wrap>
          <Elems.Select
            small
            search
            title={I18n.t('selectCountryCode')}
            valueLabel
            onValueChange={setCode}
            selectedValue={code}
            options={countries}>
            <Elems.Input
              defaultValue={phone}
              onActive={setActive}
              onValid={setValid}
              type="phone"
              placeholder={I18n.t('phoneNumber')}
              fustyle="f:1"
              onSubmit={() => valid && signIn()}
              onDone={setPhone} />
          </Elems.Select>
          <Elems.Wrap fustyle="f:0 fd:row mt:s5 x@mb:s10">
            <Elems.Button
              testID={'signin-signin-button'}
              accessibilityLabel={'signin-signin-button'}
              onPress={signIn}
              disable={!valid}
              text={I18n.t('signIn')} />
          </Elems.Wrap>
        </Elems.Wrap>
      </Elems.KeyboardWrap>
    </Comps.Layout>
  )

  async function signIn() {
    const exists = await utils.mainInstance.get(`/exist/${String(phone)}?code=${code}`).catch(() => false)

    if (!exists) return utils.navigator.navigate('ClikEkycVerify', {
      phoneNumber: phone,
      countryCode: code.replace('+', ''),
      provider: '5cd50984-2d31-11ea-978f-2e728ce88125'
    })

    utils.navigator.navigate('ConfirmPin', {
      title: I18n.t('enterPin'),
      message: I18n.t('pleaseEnterPin'),
      onDone: pin => dispatch(actions.signin(pin, phone, code)),
      action: 'signin',
      phone,
      code
    })
  }

  function handleCountries() {
    utils.mainInstance.get(`/countries`)
      .then(({ data: { data } }) => setCountries(data.map(country => ({
        flag: true,
        logo: country.flagUrl,
        label: `${country.countryCode} ${country.name}`,
        value: country.countryCode
      }))))
  }
}

export default WelcomeScreen

const Language = Actheme.create({
  Wrap: 'f:0 fd:row jc:fe ph:s5 pv:s3 x@pt:s8',
  Touch: ['TouchableOpacity', 'fd:row ai,jc:c'],
  Text: ['Text', 'ml:s2 c:title fs:s5 pb:2 ff:ns600 tt:uc'],
  Icon: [Elems.Icon, ['fs:s7 c:prim', { name: 'language'}]],

  Comp: ({ locale }) => (
    <Language.Wrap>
      <Language.Touch onPress={() => utils.navigator.navigate('Language')}>
        <Language.Icon />
        <Language.Text>{locale}</Language.Text>
      </Language.Touch>
    </Language.Wrap>
  )
})
