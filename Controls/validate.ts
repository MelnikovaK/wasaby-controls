/**
 * Библиотека контролов, которые позволяют организовать валидацию данных на форме.
 * @library Controls/validate
 * @includes Controller Controls/_validate/Controller
 * @includes Container Controls/_validate/Container
 * @includes InputContainer Controls/_validate/InputContainer
 * @includes isEmail Controls/_validate/Validators/IsEmail
 * @includes isRequired Controls/_validate/Validators/IsRequired
 * @includes isValidDate Controls/_validate/Validators/IsValidDate
 * @includes Selection Controls/_validate/Selection
 * @includes IsValidDateRange Controls/_validate/Validators/IsValidDateRange
 * @public
 * @author Красильников А.С.
 */
/*
 * validate library
 * @library Controls/validate
 * @includes Controller Controls/_validate/Controller
 * @includes Container Controls/_validate/Container
 * @includes InputContainer Controls/_validate/Input
 * @includes isEmail Controls/_validate/Validators/IsEmail
 * @includes isRequired Controls/_validate/Validators/IsRequired
 * @includes isValidDate Controls/_validate/Validators/IsValidDate
 * @includes Selection Controls/_validate/Selection
 * includes IsValidDateRange Controls/_validate/Validators/IsValidDateRange
 * @public
 * @author Красильников А.С.
 */

import isEmail = require('Controls/_validate/Validators/IsEmail');
import isRequired = require('Controls/_validate/Validators/IsRequired');
import isValidDate = require('Controls/_validate/Validators/IsValidDate');
import isValidDateRange from 'Controls/_validate/Validators/IsValidDateRange';

export {default as Controller} from 'Controls/_validate/Controller';
export {default as Container} from 'Controls/_validate/Container';
export {default as InputContainer} from 'Controls/_validate/InputContainer';
export {default as DateRangeContainer} from 'Controls/_validate/DateRange';
export {default as Selection} from 'Controls/_validate/Selection';

export {
    isEmail,
    isRequired,
    isValidDate,
    isValidDateRange
}
