/*
 * stateManager.h
 *
 *  Created on: Sep 15, 2025
 *      Author: lenovo
 */
#ifndef LEDSTATUS_H
#define LEDSTATUS_H
#include "stm32f0xx_hal.h"

void ledUpdate(GPIO_TypeDef* redLedPort,   uint16_t redLedPin,
               GPIO_TypeDef* yellowLedPort,uint16_t yellowLedPin,
               GPIO_TypeDef* greenLedPort, uint16_t greenLedPin);

#endif

