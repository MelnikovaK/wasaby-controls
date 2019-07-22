/**
 * Интерфейс для поддержки ввода диапазона дат.
 * @interface Controls/_dateRange/interfaces/IInput
 * @public
 * @author Красильников А.С.
 */

/*
 * Interface for date range inputs.
 * @interface Controls/_dateRange/interfaces/IInput
 * @public
 * @author Красильников А.С.
 */

/**
 * @name Controls/_dateRange/interfaces/IInput#startValue
 * @cfg {Date} Начальное значение диапазона.
 * @example
 * В этом примере значение _startValue в состоянии контрола привязывается к значению поля ввода.
 * В любое время жизненного цикла контрола, _startValue будет содержать текущее начальное значение поля ввода.
 * <pre>
 *    <Controls.Input.DateRande bind:startValue="_startValue" />
 *    <Controls.Button on:click="_sendButtonClick()" />
 * </pre>
 * <pre>
 *    Control.extend({
 *       ...
 *       _startValue: new Date(),
 *      _sendButtonClick() {
 *         this._sendData(this._startValue);
 *      }
 *      ...
 *   });
 * </pre>
 */

/*
 * @name Controls/_dateRange/interfaces/IInput#startValue
 * @cfg {Date} Beginning of period
 * @example
 * In this example you bind _startValue in control's state to the value of input field.
 * At any time of control's lifecycle, _startValue will contain the current start value of the input field.
 * <pre>
 *    <Controls.Input.DateRande bind:startValue="_startValue" />
 *    <Controls.Button on:click="_sendButtonClick()" />
 * </pre>
 * <pre>
 *    Control.extend({
 *       ...
 *       _startValue: new Date(),
 *      _sendButtonClick() {
 *         this._sendData(this._startValue);
 *      }
 *      ...
 *   });
 * </pre>
 */

/**
 * @name Controls/_dateRange/interfaces/IInput#endValue
 * @cfg {Date} Конечное значение диапазона.
 * @example
 * В этом примере значение _endValue в состоянии контрола привязывается к значению поля ввода.
 * В любое время жизненного цикла контрола, _endValue будет содержать текущее конечное значение поля ввода.
 * <pre>
 *    <Controls.Input.DateRange bind:endValue="_endValue" />
 *    <Controls.Button on:click="_sendButtonClick()" />
 * </pre>
 * <pre>
 *    Control.extend({
 *       ...
 *       _endValue: new Date(),
 *      _sendButtonClick() {
 *         this._sendData(this._endValue);
 *      }
 *      ...
 *   });
 * </pre>
 */

/*
 * @name Controls/_dateRange/interfaces/IInput#endValue
 * @cfg {Date} End of period
 * @example
 * In this example you bind _endValue in control's state to the value of input field.
 * At any time of control's lifecycle, _endValue will contain the current ens value of the input field.
 * <pre>
 *    <Controls.Input.DateRange bind:endValue="_endValue" />
 *    <Controls.Button on:click="_sendButtonClick()" />
 * </pre>
 * <pre>
 *    Control.extend({
 *       ...
 *       _endValue: new Date(),
 *      _sendButtonClick() {
 *         this._sendData(this._endValue);
 *      }
 *      ...
 *   });
 * </pre>
 */

/**
 * @event Controls/_dateRange/interfaces/IInput#startValueChanged Происходит при изменении начального значения поля.
 * @param {Date} value Новое значение поля.
 * @param {String} displayValue Текстовое значение поля.
 * @remark
 * Это событие должно использоваться для реагирования на изменения, вносимые пользователем в поле.
 * @example
 * В этом примере мы покажем, как осуществить "привязку" значения контрола к полю.
 * В первом поле мы делаем это вручную, используя событие valueChanged. Во втором поле используется формат "привязки".
 * Оба поля в этом примере будут иметь одинаковое поведение.
 * <pre>
 *    <Controls.dateRange:Input startValue="_fieldValue" on:startValueChanged="_valueChangedHandler()"/>
 *    <Controls.dateRange:Input bind:startValue="_anotherFieldValue"/>
 * </pre>
 * <pre>
 *    Control.extend({
 *       ....
 *       _fieldValue: null,
 *       _valueChangedHandler(value, displayValue) {
 *          this._fieldValue = value;
 *          this._saveToDatabase(displayValue);
 *       },
 *       _anotherFieldValue: null
 *       ...
 *    });
 * </pre>
 */

/*
 * @event Controls/_dateRange/interfaces/IInput#startValueChanged Occurs when field start value was changed.
 * @param {Date} value New field value.
 * @param {String} displayValue Text value of the field.
 * @remark
 * This event should be used to react to changes user makes in the field.
 * @example
 * In this example, we show how you can 'bind' control's value to the field.
 * In the first field, we do it manually using valueChanged event. In the second field we use bind notation.
 * Both fields in this examples will have identical behavior.
 * <pre>
 *    <Controls.dateRange:Input startValue="_fieldValue" on:startValueChanged="_valueChangedHandler()"/>
 *    <Controls.dateRange:Input bind:startValue="_anotherFieldValue"/>
 * </pre>
 * <pre>
 *    Control.extend({
 *       ....
 *       _fieldValue: null,
 *       _valueChangedHandler(value, displayValue) {
 *          this._fieldValue = value;
 *          this._saveToDatabase(displayValue);
 *       },
 *       _anotherFieldValue: null
 *       ...
 *    });
 * </pre>
 */

/**
 * @event Controls/_dateRange/interfaces/IInput#endValueChanged Происходит при изменении конечного значения поля.
 * @param {Date} value Новое значение поля.
 * @param {String} displayValue Текстовое значение поля.
 * @remark
 * Это событие должно использоваться для реагирования на изменения, вносимые пользователем в поле.
 * @example
 * В этом примере мы покажем, как осуществить "привязку" значения контрола к полю.
 * В первом поле мы делаем это вручную, используя событие valueChanged. Во втором поле используется формат "привязки".
 * Оба поля в этом примере будут иметь одинаковое поведение.
 * <pre>
 *    <Controls.dateRange:Input endValue="_fieldValue" on:endValueChanged="_valueChangedHandler()"/>
 *    <Controls.dateRange:Input bind:endValue="_anotherFieldValue"/>
 * </pre>
 * <pre>
 *    Control.extend({
 *       ....
 *       _fieldValue: null,
 *       _valueChangedHandler(value, displayValue) {
 *          this._fieldValue = value;
 *          this._saveToDatabase(displayValue);
 *       },
 *       _anotherFieldValue: null,
 *       ...
 *    });
 * </pre>
 */

/*
 * @event Controls/_dateRange/interfaces/IInput#endValueChanged Occurs when field end value was changed.
 * @param {Date} value New field value.
 * @param {String} displayValue Text value of the field.
 * @remark
 * This event should be used to react to changes user makes in the field.
 * @example
 * In this example, we show how you can 'bind' control's value to the field.
 * In the first field, we do it manually using valueChanged event. In the second field we use bind notation.
 * Both fields in this examples will have identical behavior.
 * <pre>
 *    <Controls.dateRange:Input endValue="_fieldValue" on:endValueChanged="_valueChangedHandler()"/>
 *    <Controls.dateRange:Input bind:endValue="_anotherFieldValue"/>
 * </pre>
 * <pre>
 *    Control.extend({
 *       ....
 *       _fieldValue: null,
 *       _valueChangedHandler(value, displayValue) {
 *          this._fieldValue = value;
 *          this._saveToDatabase(displayValue);
 *       },
 *       _anotherFieldValue: null,
 *       ...
 *    });
 * </pre>
 */

/**
 * @event Controls/_dateRange/interfaces/IInput#inputCompleted Происходит при завершении ввода (поле потеряло фокус или пользователь нажал "enter").
 * @param {Date} startValue Начальное значение поля.
 * @param {Date} endValue Конечно значение поля.
 * @param {String} displayedStartValue Начальное текстовое значение поля.
 * @param {String} displayedEndValue Конечное текстовое значение поля.
 * @remark
 * Это событие можно использовать в качестве триггера для проверки поля или отправки введенных данных в какой-либо другой контрол.
 * @example
 * В этом примере мы подписываемся на событие inputCompleted и сохраняем значение поля в первой базе данных и отображаемое значение поля во второй базе данных.
 * <pre>
 *    <Controls.dateRange:Input on:inputCompleted="_inputCompletedHandler()" />
 * </pre>
 * <pre>
 *    Control.extend({
 *       ....
 *       _inputCompletedHandler(startValue, endValue, displaydStartValue, displaydEndValue) {
 *          this._saveEnteredValueToDabase1(startValue, endValue);
 *          this._saveEnteredValueToDabase2(displaydStartValue, displaydEndValue);
 *       },
 *       ...
 *    })
 * </pre>
 */

/*
 * @event Controls/_dateRange/interfaces/IInput#inputCompleted Occurs when input was completed (field lost focus or user pressed ‘enter’).
 * @param {Date} startValue Start field value.
 * @param {Date} endValue End field value.
 * @param {String} displayedStartValue Text value of the start field.
 * @param {String} displayedEndValue Text value of the end field.
 * @remark
 * This event can be used as a trigger to validate the field or send entered data to some other control.
 * @example
 * In this example, we subscribe to inputCompleted event and save field's value to the first database and field`s display value to the second database.
 * <pre>
 *    <Controls.dateRange:Input on:inputCompleted="_inputCompletedHandler()" />
 * </pre>
 * <pre>
 *    Control.extend({
 *       ....
 *       _inputCompletedHandler(startValue, endValue, displaydStartValue, displaydEndValue) {
 *          this._saveEnteredValueToDabase1(startValue, endValue);
 *          this._saveEnteredValueToDabase2(displaydStartValue, displaydEndValue);
 *       },
 *       ...
 *    })
 * </pre>
 */
