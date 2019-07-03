/**
 * Библиотка хлебных крошек.
 * @library Controls/breadcrumbs
 * @includes Path Controls/_breadcrumbs/Path
 * @includes HeadingPath Controls/_breadcrumbs/HeadingPath
 * @includes BreadCrumbsStyles Controls/_breadcrumbs/BreadCrumbsStyles
 * @includes PathStyles Controls/_breadcrumbs/PathStyles
 * @author Авраменко А. С.
 */

/*
 * Breadcrumbs library
 * @library Controls/breadcrumbs
 * @includes Path Controls/_breadcrumbs/Path
 * @includes HeadingPath Controls/_breadcrumbs/HeadingPath
 * @includes BreadCrumbsStyles Controls/_breadcrumbs/BreadCrumbsStyles
 * @includes PathStyles Controls/_breadcrumbs/PathStyles
 * @author Авраменко А. С.
 */
import ItemTemplate = require('wml!Controls/_breadcrumbs/View/resources/itemTemplate');

export {default as Path} from './_breadcrumbs/Path';
export {default as View} from './_breadcrumbs/View';
export {default as HeadingPath} from './_breadcrumbs/HeadingPath';
export {default as HeadingPathBack} from './_breadcrumbs/HeadingPath/Back';
export {default as HeadingPathCommon} from './_breadcrumbs/HeadingPath/Common';
export {ItemTemplate};
