/**
 * Created by rn.kondakov on 06.12.2018.
 */



   /**
    *
    * Модуль с функцией получения html без внешнего тега.
    * Распознаватель тегов для jsonToHtml в {@link Controls/decorator:Converter}.
    *
    * @class Controls/_decorator/Markup/resolvers/noOuterTag
    * @public
    * @author Кондаков Р.Н.
    */

   /*
    *
    * Module with a function to get html without outer tag.
    * Tag resolver for jsonToHtml in {@link Controls/decorator:Converter}.
    *
    * @class Controls/_decorator/Markup/resolvers/noOuterTag
    * @public
    * @author Кондаков Р.Н.
    */    
   export default function noOuterTag(value, parent) {
      if (!parent && value[0] === 'div') {
         value[0] = [];
      }
      return value;
   };

