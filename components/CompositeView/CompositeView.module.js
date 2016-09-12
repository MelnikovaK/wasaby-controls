define('js!SBIS3.CONTROLS.CompositeView', ['js!SBIS3.CONTROLS.DataGridView', 'js!SBIS3.CONTROLS.CompositeViewMixin'], function(DataGridView, CompositeViewMixin) {
   'use strict';

      /**
       * Контрол отображающий набор данных, в виде таблицы, плитки или списка
       * @class SBIS3.CONTROLS.CompositeView
       * @extends SBIS3.CONTROLS.DataGridView
       * @mixes SBIS3.CONTROLS.CompositeViewMixin
       * @author Крайнов Дмитрий Олегович
       *
       * @demo SBIS3.CONTROLS.Demo.MyCompositeView
       * @cssModifier controls-TreeView-big У папок размер текста 16px, у листьев 15px. Только в режиме список (table)
       *
       * @control
       * @public
       * @category Lists
       * @initial
       * <component data-component='SBIS3.CONTROLS.CompositeView'>
       *    <options name="columns" type="array">
       *       <options>
       *          <option name="title">Поле 1</option>
       *          <option name="width">100</option>
       *       </options>
       *       <options>
       *          <option name="title">Поле 2</option>
       *       </options>
       *    </options>
       * </component>
       */   
      
   var CompositeView = DataGridView.extend([CompositeViewMixin],/** @lends SBIS3.CONTROLS.CompositeView.prototype*/ {

      $protected: {

      }

   });

   return CompositeView;

});