import React, { useState } from 'react'
import BigNumber from 'bignumber.js'

import { Modal, Button, Header } from '@aragon/ui'

import UniswapBuySell from '../UniswapTrade/UniswapBuySell'

import * as types from '../../types'
import { toTokenUnitsBN } from '../../utils/number'
// import { SectionTitle } from '../common'

type TradeModalProps = {
  spotPrice: BigNumber
  balance: BigNumber
  oToken: types.ETHOption
}

function TradeModal({ oToken, spotPrice, balance }: TradeModalProps) {

  const [opened, setOpened] = useState(false)

  return (
    <>
      <Button onClick={() => setOpened(true)} size="small">Trade</Button>
      <Modal 
        width={(viewport)=>{Math.min(viewport.width, 600)}} 
        visible={opened} 
        onClose={() => setOpened(false)} >
        <Header primary="Trade on Uniswap" />
        <UniswapBuySell
          spotPrice={spotPrice}
          strikePriceInUSD={oToken.strikePriceInUSD}
          symbol={oToken.symbol}
          tokenBalance={toTokenUnitsBN(balance, oToken.decimals)}
          token={oToken.addr}
          exchange={oToken.exchange}
          decimals={oToken.decimals}
        />
      </Modal>
    </>
  )
}

export default TradeModal