/*
 * Copyright 2016 Joachim Bakke
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/



/* 
 * STALK codec
 * 
 * @repository 		
 * @author 		
 *
 */

"use strict";

/*
	    0  1  2  3 
       	    |  |  |  | 
     $STALK,xx,yy,nn*CS 
where:
        STALK     	Raymarine Seatalk1 datagram sentence
0 			00-9C       	Datagram type 
1 			hex       	First datagram content 
2 			hex   		Last datagram content 
3 			hex      	Checksum 

*/

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('STALK', function(multiplexer, input) {
  var values = input.values;

multiplexer.self();

var x = parseInt(values[0], 16);
switch(x){
case 0x84:	/*Compass heading and turning direction, autopilot course, active mode (standby, auto , wind, track) and rudden position*/
  var U = parseInt(values[1].charAt(0),16);
  var VW = parseInt(values[2],16);
  var V = parseInt(values[2].charAt(0),16);
  var XY = values[3];
  var Z = parseInt(values[4].charAt(1),16);
  var M = parseInt(values[5].charAt(1),16);
  var RR = parseInt(values[6],16);
  var SS = parseInt(values[7],16);
  var TT = parseInt(values[8],16);
  var compassHeading = (U & 0x3)*90 + (VW & 0x3F) *2 + (U & 0xC ? (U & 0xC == 0xC ? 2 : 1): 0);
  var apCourse = ((V & 0xC )>> 2)* 90 + parseInt(XY,16)/ 2;
 	/*Positive to right*/
var rudderPos = RR;
  if (rudderPos > 127) { rudderPos = rudderPos - 256};

var modeVar = (Z & 0x2);
  switch(modeVar){
    case 0: var mode = "standby";
	break;
    case 2: var mode = "auto";
	break;
    default: break;
    }
if ((Z & 0x4) == 4) {
  var mode = "wind";
}
if ((Z & 0x8) == 8) {
  var mode = "route"; 
}

  var pathValues = []
  if (compassHeading) {
    pathValues.push({
      path: 'navigation.headingMagnetic',
      value: this.transform(this.float(compassHeading), 'deg', 'rad')
    })
  }
  if (apCourse) {
    pathValues.push({
      path: 'steering.autopilot.target.headingMagnetic',
      value: this.transform(this.float(apCourse), 'deg', 'rad')
    })
  }
  if (rudderPos) {
    pathValues.push({
      path: 'steering.rudderAngle',
      value: this.transform(this.float(rudderPos), 'deg', 'rad')
    })
  }
  if (mode) {
    pathValues.push({
      path: 'steering.autopilot.state',
      value: mode
    })
  }                

  if (pathValues.length > 0) {
    multiplexer.add({
      "updates": [{
        "source": this.source(input.instrument),
        "timestamp": this.timestamp(),
        "values": pathValues
      }],
      "context": multiplexer._context
    });
  }
  return true;

  break;
case 0x9C:	/*Compass heading and turning direction*/
  var U = parseInt(values[1].charAt(0),16);
  var VW = parseInt(values[2],16);
  var RR = parseInt(values[3],16);

  var compassHeading = (U & 0x3)*90 + (VW & 0x3F) *2 + (U & 0xC ? (U & 0xC == 0xC ? 2 : 1): 0);
  var rudderPos = RR;
  if (rudderPos > 127) { rudderPos = rudderPos - 256};
    
  
  var pathValues = []
  if (compassHeading) {
    pathValues.push({
      path: 'navigation.headingMagnetic',
      value: this.transform(this.float(compassHeading), 'deg', 'rad')
    })
  }
  if (rudderPos) {
    pathValues.push({
      path: 'steering.rudderAngle',
      value: this.transform(this.float(rudderPos), 'deg', 'rad')
    })
  }

  if (pathValues.length > 0) {
    multiplexer.add({
      "updates": [{
        "source": this.source(input.instrument),
        "timestamp": this.timestamp(),
        "values": pathValues
      }],
      "context": multiplexer._context
    });
  }
  return true;
  break;

default:
  break;
}

});

