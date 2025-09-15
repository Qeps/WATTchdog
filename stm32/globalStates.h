/*
 * globalStates.h
 *
 *  Created on: Sep 15, 2025
 *      Author: lenovo
 */

#ifndef INC_GLOBALSTATES_H_
#define INC_GLOBALSTATES_H_

typedef enum {
    STATE_WIFI,
    STATE_GSM,
    STATE_DESKTOP,
    STATE_LOW_BATTERY
} CommState;

extern volatile CommState currentState;

#endif /* INC_GLOBALSTATES_H_ */
