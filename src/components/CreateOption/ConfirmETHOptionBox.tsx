import React, { useState } from 'react'
import BigNumber from 'bignumber.js'
import { Box, Header, Button, useTheme, useToast, LoadingRing } from '@aragon/ui'

import { SectionTitle, Comment } from '../common'

import CompleteCreate from './Complete'

import { USDC, OPYN_ETH } from '../../constants/tokens'

import { getOwner } from '../../utils/infura'
import { createOption, setDetail } from '../../utils/web3'

type ConfirmOptionProps = {
  user: string,
  putOrCall: 0 | 1; //'Put' | 'Call',
  americanOrEuropean: 0 | 1; // 'american' | 'european',
  strikePrice: number,
  expiration: Date,
  strikePriceIsValid: Boolean,
  setProgress: Function
}

function ConfirmETHOption(
  {
    user,
    putOrCall,
    americanOrEuropean,
    strikePrice,
    expiration,
    strikePriceIsValid,
    setProgress
  }: ConfirmOptionProps) {
  const toast = useToast()

  const [isCreating, setIsCreating] = useState(false)
  const [isFactoryOwner, setIsFactoryOwner] = useState(false)
  const [isSettingDetail, setIsSettingDetail] = useState(false)

  const type = putOrCall === 0 ? 'Put' : 'Call'
  const expiry = new BigNumber(expiration.getTime()).div(1000).toNumber()
  const window = americanOrEuropean === 0
    ? expiry
    : new BigNumber(expiry).minus(86400).toNumber()
  const name = `Opyn ETH ${type} $${strikePrice} ${FormatDate(expiration)}`
  const symbol = `oETH $${strikePrice} ${type} ${FormatDate(expiration)}`

  const [newTokenAddr, setNewTokenAddr] = useState('')


  // Create option -> Check user permission -> Set detail
  const onClickCreate = async () => {
    if (!user) {
      toast("Please connect wallet first")
      return
    }
    if (!strikePriceIsValid) {
      toast("Invalid strike price.")
      return
    }
    let newTokenAddr = ''
    setIsCreating(true)
    if (type === 'Put') {
      const oToken = await createOption(
        USDC.symbol, // collateral
        -1 * USDC.decimals,
        OPYN_ETH.symbol, // underlying
        -1 * OPYN_ETH.decimals,
        -7, // decimals
        new BigNumber(strikePrice).div(10).integerValue().toNumber(), //strike price
        -6, // strikePrice exp
        USDC.symbol,
        expiry,
        window
      )

      newTokenAddr = oToken
    } else { // Create a eth call
      const strikePriceNum = new BigNumber(10000000).div(strikePrice).integerValue().toNumber()
      const oToken = await createOption(
        OPYN_ETH.symbol, // collateral
        -1 * OPYN_ETH.decimals,
        USDC.symbol, // underlying
        -1 * USDC.decimals,
        -7, // decimals
        strikePriceNum, //strike price
        -14, // strikePrice exp
        OPYN_ETH.symbol,
        expiry,
        window
      )

      newTokenAddr = oToken
    }
    const owner = await getOwner(newTokenAddr)
    const isOwner = owner === user
    setIsFactoryOwner(isOwner)
    setIsCreating(false)
    setNewTokenAddr(newTokenAddr)

    // is factory owner: proceed to detail setting tx.
    if (isOwner) {
      setIsSettingDetail(true)
      setProgress(0.9)
      try {
        await setDetail(newTokenAddr, symbol, name)
      } catch (error) {
        setIsFactoryOwner(false)
      }
      setIsSettingDetail(false)
    }
    setProgress(1)
  }

  return (
    <Box>
      {
        // not created
        newTokenAddr === '' ?
          isCreating
            ? <ProcessingBox text="Creating Option..." />
            // Wait for confirm
            : <ConfirmDiv americanOrEuropean={americanOrEuropean} name={name} symbol={symbol} putOrCall={putOrCall} onClickCreate={onClickCreate} />

          // Already created
          : isFactoryOwner
            ? isSettingDetail
              ? <ProcessingBox text="Setting Detail..." />
              : <CompleteCreate address={newTokenAddr} isFactoryOwner={true} />
            : // option created, has no permission to set detail
            <CompleteCreate address={newTokenAddr} isFactoryOwner={false} />
      }
    </Box>
  )

}

export default ConfirmETHOption

type ConfirmDivProps = {
  americanOrEuropean: 0 | 1,
  name: string,
  symbol: string,
  putOrCall: 0 | 1,
  onClickCreate: Function
}
function ConfirmDiv({ americanOrEuropean, name, symbol, putOrCall, onClickCreate }: ConfirmDivProps) {
  const theme = useTheme()
  return (
    <div style={{ display: 'flex', height: 300 }}>
      <div style={{ width: '40%', paddingTop: 100, paddingLeft: 100 }}>
        <SectionTitle title="Almost done!" />
        <div style={{ paddingLeft: 5 }}><Comment text="Confirm option detail" /></div>
      </div>
      <div style={{ width: '15%', paddingTop: 60, color: theme.info }}>
        <div>Type</div>
        <div>Name</div>
        <div>Symbol</div>
        <br></br>
        <div>Strike</div>
        <div>Underlying</div>
      </div>
      <div style={{ width: '30%', paddingTop: 60 }}>
        <div>{americanOrEuropean ? 'European' : 'American'}</div>
        <div>{name}</div>
        <div>{symbol}</div>
        <br></br>
        <div>{putOrCall === 0 ? USDC.symbol : OPYN_ETH.symbol}</div>
        <div>{putOrCall === 0 ? OPYN_ETH.symbol : USDC.symbol}</div>
      </div>
      <div style={{ width: '10%', paddingTop: 130 }}>
        <Button label="Create" onClick={onClickCreate}></Button>
      </div>
    </div>
  )
}

function ProcessingBox({ text }: { text: string }) {
  return (
    <div style={{ height: 300, paddingTop: 40 }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
        <Header primary={text} />
        <div style={{padding: 25}}><LoadingRing mode="half-circle" /></div>
      </div>
    </div>
  )
}


/**
 * Format datetime to dd/mm/yy
 * @param date 
 */
function FormatDate(date: Date) {
  var dd = date.getDate().toString();
  var mm = (date.getMonth() + 1).toString();
  var yy = date.getFullYear().toString().substr(-2);

  if (parseInt(dd) < 10) {
    dd = '0' + dd
  }
  if (parseInt(mm) < 10) {
    mm = '0' + mm
  }

  return dd + '/' + mm + '/' + yy;
}