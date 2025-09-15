#include "ledStatus.h"
#include "globalStates.h"

void ledUpdate(GPIO_TypeDef* redLedPort,	uint16_t redLedPin,
               GPIO_TypeDef* yellowLedPort, uint16_t yellowLedPin,
               GPIO_TypeDef* greenLedPort,	uint16_t greenLedPin)
{
    HAL_GPIO_WritePin(redLedPort, redLedPin, GPIO_PIN_RESET);
    HAL_GPIO_WritePin(yellowLedPort, yellowLedPin, GPIO_PIN_RESET);
    HAL_GPIO_WritePin(greenLedPort, greenLedPin, GPIO_PIN_RESET);

    switch (currentState) {
        case STATE_WIFI:
            HAL_GPIO_WritePin(greenLedPort, greenLedPin, GPIO_PIN_SET);
            // TODO WiFi communication handler
            break;
        case STATE_GSM:
            HAL_GPIO_WritePin(yellowLedPort, yellowLedPin, GPIO_PIN_SET);
            // TODO GSM communication handler
            break;
        case STATE_DESKTOP:
        	HAL_GPIO_WritePin(redLedPort, redLedPin, GPIO_PIN_SET);
        	HAL_GPIO_WritePin(yellowLedPort, yellowLedPin, GPIO_PIN_SET);
        	HAL_GPIO_WritePin(greenLedPort, greenLedPin, GPIO_PIN_SET);
            // TODO desktop application communication handler
            break;
        case STATE_LOW_BATTERY:
            HAL_GPIO_WritePin(redLedPort, redLedPin, GPIO_PIN_SET);
            // TODO battery level detection
            break;
    }
}

