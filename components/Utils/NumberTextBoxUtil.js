/**
 * Created by vs.romanov on 09.01.2017.
 */
define('SBIS3.CONTROLS/Utils/NumberTextBoxUtil', [],
    /**
     * @class SBIS3.CONTROLS/Utils/NumberTextBoxUtil
     * @public
     */
    function () /** @lends SBIS3.CONTROLS/Utils/NumberTextBoxUtil.prototype */{
       var
          MAX_NUMBER_OF_DIGITS = 16,
          MAX_SAFE_INTEGER = 9007199254740991;

       return {
            /**
             *
             * @param value
             * @param maxLength
             * @returns {boolean}
             */
            checkMaxLength: function (value, maxLength) {
                var length = this._getValueLength(value);
                return !(maxLength && length > maxLength) && length <= MAX_NUMBER_OF_DIGITS && parseFloat(value) <= MAX_SAFE_INTEGER;
            },
            /**
             *
             * @param b
             * @param e
             * @param currentVal
             * @param delimiters
             * @param integers
             * @param decimals
             * @param keyCode
             * @param maxLength
             * @returns {*}
             */
            numberPress: function(b, e, currentVal, delimiters, integers, decimals, keyCode, maxLength){
                var dotPosition = currentVal.indexOf('.'),
                    oldValue = currentVal,
                    symbol = String.fromCharCode(keyCode),
                    integerCount =  this._getIntegersCount(currentVal),
                    checkMaxLengthResult = this.checkMaxLength(currentVal, maxLength),
                    newCaretPosition = b,
                    isFull = this._getValueLength(currentVal) === parseInt(maxLength, 10) || integerCount === integers || integerCount === MAX_NUMBER_OF_DIGITS,
                    replaceFirstZero = false;

                if (((currentVal[0] == 0 && b == 1) || (currentVal[0] == '-' && currentVal[1] == 0 && b == 2)) && b == e ){ // заменяем первый ноль если курсор после него
                    newCaretPosition--;
                    replaceFirstZero = true;
                }
                if ((b <= dotPosition && e <= dotPosition) || dotPosition == -1) { //до точки
                    if (b == e) {
                        if (checkMaxLengthResult) {
                            if(delimiters && currentVal.length && currentVal[e] === ' '){
                                newCaretPosition += 2;
                                // если поле ввода заполнено и курсор установлен на разделитель, то необходимо сдвинуть крайнию позицию,
                                // чтобы обновить цифру иначе заменится пробел
                                if(isFull){
                                    e+=1;
                                }
                            }else {
                                (delimiters && integerCount && integerCount % 3 == 0 && integerCount !== integers && currentVal.length && !isFull) ? newCaretPosition += 2 : newCaretPosition++;
                            }
                            if(currentVal[e] === ' ' && isFull){
                                e+=1;
                                newCaretPosition++;
                            }
                            if (isFull && currentVal[e] === '.') { //Введено максимальное количество знаков в целой части, и курсор стоит перед точкой
                               currentVal = currentVal.substr(0, replaceFirstZero ? (this._isNumberPositive(currentVal) ? 0 : 1) : b + 1) + symbol + currentVal.substr(e + 2);
                               newCaretPosition++;
                            } else {
                               currentVal = currentVal.substr(0, replaceFirstZero ? (this._isNumberPositive(currentVal) ? 0 : 1) : b) + symbol + currentVal.substr(isFull ? e + 1 : e);
                            }
                        }
                    } else {
                        currentVal = currentVal.substr(0, b) + symbol + currentVal.substr(e);
                        newCaretPosition++;
                    }
                } else
                if (b > dotPosition && e > dotPosition){ // после точки
                    if (b == e) {
                        if(checkMaxLengthResult || (e <= dotPosition + decimals)) {
                            currentVal = currentVal.substr(0, b) + symbol + currentVal.substr(e + ((decimals !== 0) ? 1 : 0));
                        }
                    } else {
                        currentVal = currentVal.substr(0, b) + symbol + ((decimals > 0) ? this._getZeroString(e - b - 1) : '') + currentVal.substr(e);
                    }
                    newCaretPosition++;
                } else { // точка в выделении
                    currentVal = currentVal.substr(0, b) + symbol + '.' + ((decimals > 0) ? this._getZeroString(e - dotPosition - 1) : '') + currentVal.substr(e);
                    newCaretPosition = currentVal.indexOf('.');
                }
                currentVal = currentVal.replace(/\s/g, '');

                if(!this.checkMaxLength(currentVal, maxLength)){
                    currentVal = oldValue;
                }

                return {value: currentVal, caretPosition: newCaretPosition};
            },
            /**
             *
             * @param b
             * @param e
             * @param currentVal
             * @param delimiters
             * @param decimals
             * @returns {{value: (*|XML|string|void|tinymce.html.Node), caretPosition: *, step: *}}
             */
            deletPressed: function (b, e, currentVal, delimiters, decimals) {
                var dotPosition = currentVal.indexOf('.'),
                    newCaretPosition = e, step;

                (currentVal[b] == ' ') ? step = 2 : step = 1;
                if (b === 0 && e === currentVal.length) {
                    currentVal = '';
                    newCaretPosition = b;
                } else {
                    if ((b <= dotPosition && e <= dotPosition) || dotPosition == -1) { //до точки
                        if (b == e) {
                            if (b == dotPosition) {
                                newCaretPosition++;
                            }
                            if (!(decimals > 0) || (decimals && b != dotPosition)) {
                                currentVal = currentVal.substr(0, b) + currentVal.substr(e + step);
                            }
                        } else {
                            currentVal = currentVal.substr(0, b) + currentVal.substr(e);
                            newCaretPosition = b;
                        }
                        if (delimiters && this._getIntegersCount(currentVal) % 3 == 0 && b != dotPosition) {
                            newCaretPosition--;
                        }
                    } else if (b > dotPosition && e > dotPosition) { // после точки
                        if (b == e) {
                            currentVal = currentVal.substr(0, b) + currentVal.substr(e + 1);
                        } else {
                            currentVal = currentVal.substr(0, b) + currentVal.substr(e);
                            newCaretPosition = b;
                        }
                    } else { // точка в выделении
                        currentVal = currentVal.substr(0, b) + (decimals > 0 ? '.' : '') + currentVal.substr(e);
                        newCaretPosition = b;
                    }
                }
                currentVal = currentVal.replace(/\s/g, '');

                if (newCaretPosition == -1){
                   if (this._getIntegersCount(currentVal) == 0) { // если первый 0 перемещаем через него каретку
                      newCaretPosition += 2;
                   } else {
                      newCaretPosition += 1;
                   }
                }
                return {value: currentVal, caretPosition: newCaretPosition, step: step};
            },
            /**
             *
             * @param b
             * @param e
             * @param currentVal
             * @param delimiters
             * @param decimals
             * @returns {{value: (*|XML|string|void|tinymce.html.Node), caretPosition: *, step: *}}
             */
            backspacePressed: function (b, e, currentVal, delimiters, decimals, dotOverstep) {
                var dotPosition = currentVal.indexOf('.'),
                    newCaretPosition = b, step;

                (currentVal[b - 1] == ' ') ? step = 2 : step = 1;
                if(b === 0 && e === currentVal.length){
                    currentVal = '';
                } else {
                    if ((b <= dotPosition && e <= dotPosition) || dotPosition == -1) { //до точки
                        if (b == e) {
                            currentVal = currentVal.substr(0, b - step) + currentVal.substr(e);

                            // При удалении последнего символа целой части дроби каретку нужно оставить после 0
                            // т.к. если каретку установить перед 0, то при вводе 0 не затрется; было |0.12 стало 0|.12
                            if(this._getIntegersCount(currentVal) !== 0) {
                                (delimiters && this._getIntegersCount(currentVal) % 3 == 0) ? newCaretPosition -= 2 : newCaretPosition--;
                            }else {
                                // 0.0| -> 0|. в итоге этот метод отдаст '.' которая отрендерится в '0.' что и правильно
                                // поэтому если стираем последний 0 и у нас остается лишь точка, то необходимо
                                if(currentVal.length === 1 && currentVal[0] === '.'){
                                    currentVal = '';
                                }
                            }
                        } else {
                            currentVal = currentVal.substr(0, b) + currentVal.substr(e);
                            newCaretPosition = b;
                        }
                    } else if (b > dotPosition && e > dotPosition) { // после точки
                        if (b == e) {
                            if (!(b == dotPosition + 1 && decimals !== 0)) {
                                currentVal = currentVal.substr(0, b - 1) + currentVal.substr(e);
                            }
                            newCaretPosition = (dotPosition === b - 2) && dotOverstep ? newCaretPosition - 2 : newCaretPosition - 1;
                        } else {
                            currentVal = currentVal.substr(0, b) + currentVal.substr(e);
                            newCaretPosition = b;
                        }
                    } else { // точка в выделении
                        currentVal = currentVal.substr(0, b) + (decimals !== 0 ? '.' : '') + currentVal.substr(e);
                        newCaretPosition = b;
                    }
                }
                currentVal = currentVal.replace(/\s/g, '');

                return {value: currentVal, caretPosition: newCaretPosition, step: step};
            },

            _isNumberPositive: function(value) {
                value  = value + '';

                if(value[0] == '-'){
                    return false;
                }
                return true;
            },

            _getValueLength: function(value) {
                return value ? value.replace(/[\s.-]/g, '').length : 0;
            },
            
            _getZeroString: function(length){
                return '000000000000000000000000000000000'.substr(0, length);
            },

            _getIntegersCount: function(value){
                var dotPosition = (value.indexOf('.') != -1) ? value.indexOf('.') : value.length;
                return value.substr(0, dotPosition).replace(/\s|-/g, '').length;
            }
        }
    });