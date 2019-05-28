export interface IButtonOptions {
   style?: string;
   viewMode?: string;
   size?: string;
   transparent?: boolean;
}

/**
 * Interface for control Button.
 *
 * @interface Controls/_interface/IButton
 * @public
 * @author Михайловский Д.С.
 */
export default interface IButton {
   /**
    * @name Controls/_interface/IButton#style
    * @cfg {Enum} Button display style.
    * @variant primary
    * @variant success
    * @variant warning
    * @variant danger
    * @variant info
    * @variant secondary
    * @variant default
    * @default secondary
    * @example
    * Primary link button with 'primary' style.
    * <pre>
    *    <Controls.buttons:Path caption="Send document" style="primary" viewMode="link" size="xl"/>
    * </pre>
    * Toolbar button with 'danger' style.
    * <pre>
    *    <Controls.buttons:Path caption="Send document" style="danger" viewMode="toolButton"/>
    * </pre>
    * @see Size
    */

   /**
    * @name Controls/_interface/IButton#viewMode
    * @cfg {Enum} Button view mode.
    * @variant link Decorated hyperlink.
    * @variant button Default button.
    * @variant toolButton Toolbar button.
    * @default button
    * @example
    * Button with 'link' viewMode.
    * <pre>
    *    <Controls.buttons:Path caption="Send document" style="primary" viewMode="link" size="xl"/>
    * </pre>
    * Button with 'toolButton' viewMode.
    * <pre>
    *    <Controls.buttons:Path caption="Send document" style="danger" viewMode="toolButton"/>
    * </pre>
    * Button with 'button' viewMode.
    * <pre>
    *    <Controls.buttons:Path caption="Send document" style="success" viewMode="button"/>
    * </pre>
    * @see Size
    */

   /**
    * @name Controls/_interface/IButton#size
    * @cfg {String} Button size. The value is given by common size notations.
    * @variant s Small button size.
    * @variant m Medium button size.
    * @variant l Large button size.
    * @variant xl Extra large button size.
    * @default m
    * @example
    * 'L' size of primary button.
    * <pre>
    *    <Controls.buttons:Path caption="Send document" style="primary" viewMode="button" size="l"/>
    * </pre>
    * Default size of primary button.
    * <pre>
    *    <Controls.buttons:Path caption="Send document" style="primary" viewMode="button"/>
    * </pre>
    * Uncorrect size of primary button.
    * <pre>
    *    <Controls.buttons:Path caption="Send document" style="primary" viewMode="button" size="xl"/>
    * </pre>
    * @see style
    */

   /**
    * @name Controls/_interface/IButton#transparent
    * @cfg {Boolean} Determines whether button having background.
    * @default false
    * @remark
    * true - Button has transparent background.
    * false - Button has default background for this viewmode and style.
    * @example
    * Button has transparent background.
    * <pre>
    *    <Controls.buttons:Button caption="Send document" style="primary" viewMode="toolButton" transparent="{{true}}" size="l"/>
    * </pre>
    * Button hasn't transparent background.
    * <pre>
    *    <Controls.buttons:Button caption="Send document" style="primary" viewMode="toolButton" transparent="{{false}}"/>
    * </pre>
    * @see style
    */
   readonly '[Controls/_interface/IButton]': boolean;
}
