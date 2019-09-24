export interface IButtonOptions {
    viewMode?: string;
}
/**
 * Интерфейс для кнопок.
 *
 * @interface Controls/_buttons/interface/IButton
 * @public
 */

/*
 * Interface for Button control.
 *
 * @interface Controls/_buttons/interface/IButton
 * @public
 */
export interface IButton {
    readonly '[Controls/_buttons/interface/IButton]': boolean;
}
/**
 * @name Controls/_buttons/interface/IButton#viewMode
 * @cfg {Enum} Режим отображения кнопки.
 * @variant button В виде обычной кнопки по-умолчанию.
 * @variant link В виде гиперссылки.
 * @variant toolButton В виде кнопки для панели инструментов.
 * @default button
 * @demo Controls-demo/Buttons/ViewModes/Index
 * @example
 * Кнопка в режиме отображения 'link'.
 * <pre>
 *    <Controls.breadcrumbs:Path caption="Send document" style="primary" viewMode="link" size="xl"/>
 * </pre>
 * Кнопка в режиме отображения 'toolButton'.
 * <pre>
 *    <Controls.breadcrumbs:Path caption="Send document" style="danger" viewMode="toolButton"/>
 * </pre>
 * Кнопка в режиме отображения 'button'.
 * <pre>
 *    <Controls.breadcrumbs:Path caption="Send document" style="success" viewMode="button"/>
 * </pre>
 * @see Size
 */

/*
 * @name Controls/_buttons/interface/IButton#viewMode
 * @cfg {Enum} Button view mode.
 * @variant link Decorated hyperlink.
 * @variant button Default button.
 * @variant toolButton Toolbar button.
 * @default button
 * @example
 * Button with 'link' viewMode.
 * <pre>
 *    <Controls.breadcrumbs:Path caption="Send document" style="primary" viewMode="link" size="xl"/>
 * </pre>
 * Button with 'toolButton' viewMode.
 * <pre>
 *    <Controls.breadcrumbs:Path caption="Send document" style="danger" viewMode="toolButton"/>
 * </pre>
 * Button with 'button' viewMode.
 * <pre>
 *    <Controls.breadcrumbs:Path caption="Send document" style="success" viewMode="button"/>
 * </pre>
 * @see Size
 */

/**
 * @name Controls/_buttons/interface/IButton#contrastBackground
 * @cfg {Boolean} Определяет контрастность фона кнопки по отношению к ее окружению.
 * @default false
 * @remark
 * * true - контрастный фон.
 * * false - фон, гармонично сочетающийся с окружением.
 * Опция используется для акцентирования внимания на кнопке, и ее визуального выделения относительно окружения.
 * @demo Controls-demo/Buttons/ContrastBackground/Index
 * @example
 * У кнопки контрастный фон.
 * <pre>
 *    <Controls.buttons:Button caption="Send document" style="primary" viewMode="toolButton" contrastBackground="{{true}}" />
 * </pre>
 * @see style
 */

/*
 * @name Controls/_buttons/interface/IButton#contrastBackground
 * @cfg {Boolean} Determines if button has contrast background.
 * @default true
 * @remark
 * true - Button has contrast background
 * false - Button has the harmony background.
 * @example
 * Button has transparent background.
 * <pre>
 *    <Controls.buttons:Button caption="Send document" style="primary" viewMode="toolButton" contrastBackground="{{false}}" size="l"/>
 * </pre>
 * Button hasn't transparent background.
 * <pre>
 *    <Controls.buttons:Button caption="Send document" style="primary" viewMode="toolButton" />
 * </pre>
 * @see style
 */

/**
 * @name Controls/_buttons/interface/IButton#buttonStyle
 * @cfg {Enum} Стиль отображения кнопки.
 * @variant primary
 * @variant secondary
 * @default secondary
 * @remark
 * Стиль может влиять на цвет фона или цвет границы для различных значений режима отображения (viewMode).
 * @demo Controls-demo/Buttons/ViewModes/Index
 * @example
 * Кнопка со стилем "Primary" с иконкой по умолчанию.
 * <pre>
 *    <Controls.buttons:Button viewMode="button" buttonStyle="primary"/>
 * </pre>
 */

/*
 * @name Controls/_buttons/interface/IButton#buttonStyle
 * @cfg {Enum} Set style parameters for button. These are background color or border color for different values of viewMode
 * @variant primary
 * @variant secondary
 * @variant success
 * @variant warning
 * @variant danger
 * @default secondary
 * @example
 * Primary button with default icon style.
 * <pre>
 *    <Controls.buttons:Button viewMode="button" buttonStyle="primary"/>
 * </pre>
 */
