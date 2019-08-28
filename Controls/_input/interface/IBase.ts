import {TemplateFunction} from 'UI/Base';

export type TextAlign = 'left' | 'right';
export type AutoComplete = 'on' | 'off' | 'username' | 'current-password';

/**
 * Интерфейс базового поля ввода.
 *
 * @interface Controls/_input/interface/IBase
 * @public
 */
export interface IBaseOptions {
    /**
     * @name Controls/_input/interface/IBase#autoComplete
     * @cfg {Enum} Управление браузерным автозаполнением в поле.
     * @default off
     * @variant off Отключить автозаполнение.
     * @variant on Включить автозаполнение ранее введенными значениями.
     * @variant username Включить автозаполнение сохраненными именами пользователей.
     * @variant current-password Включить автозаполнение текущими паролями для учетной записи, указанной в поле для имени пользователя.
     * @remark
     * Значения для автозаполнения берутся браузером из его хранилища.
     * Имя поля используется для доступа к ним. Поэтому, чтобы значения, хранящиеся в одном поле, не применялись к другому, поля должны иметь разные имена.
     * Для этого мы проксируем имя контрола на нативное поле.
     * Поэтому, если вы включили автозаполнение и не хотите пересечения значений автозаполнения, то укажите имя контрола.
     * Выбирать имя следует на основе области использования поля. Например, для формы регистрации логина и пароля предпочтительно использовать имена login и password.
     * @example
     * В этом примере при щелчке по полю появляется меню браузера с ранее введенными значениями в этом поле.
     * <pre>
     *    <Controls.input:Text autoComplete="on"/>
     * </pre>
     */
    autoComplete: AutoComplete;
    /**
     * @name Controls/_input/interface/IBase#textAlign
     * @cfg {Enum} Выравнивание текста по горизонтали в поле.
     * @default left
     * @variant left Текст выравнивается по левой стороне.
     * @variant right Текст выравнивается по правой стороне.
     * @demo Controls-demo/Input/TextAlignments/Index
     */
    textAlign: TextAlign;
    /**
     * @name Controls/_input/interface/IBase#selectOnClick
     * @cfg {Boolean} Определяет выделение текста после клика по полю.
     * @remark
     * * false - Текст не выделяется.
     * * true - Текст выделяется.
     * @demo Controls-demo/Input/SelectOnClick/Index
     */
    selectOnClick: boolean;
    /**
     * @name Controls/_input/interface/IBase#placeholder
     * @cfg {String|TemplateFunction} Строка или шаблон, содержащие текст подсказки, который будет отображаться в пустом поле.
     * @demo Controls-demo/Input/Placeholders/Index
     */
    placeholder: string | TemplateFunction;
    /**
     * @name Controls/_input/interface/IBase#tooltip
     * @cfg {String} Текст всплывающей подсказки, отображаемой при наведении указателя мыши на элемент.
     * @remark
     * Подсказка отображает указанный текст, только если введенное значение полностью помещается в поле ввода. Когда значение не помещается полностью, подсказка отображает значение из поля ввода.
     * @demo Controls-demo/Input/Tooltip/Index
     */
    tooltip?: string;
    /**
     * @name Controls/_input/interface/IBase#paste
     * @function
     * @description Установить выделенное значение равным указанному значению.
     * @param {String} value Значение для замены.
     * @remark
     * Метод используется, когда выделенное значение не известно, а вам требуется заменить его на другое.
     * @demo Controls-demo/Input/Paste/Index
     */
    paste: (value: string) => void;
}

interface IBase {
    readonly '[Controls/_interface/IBase]': boolean;
}

export default IBase;