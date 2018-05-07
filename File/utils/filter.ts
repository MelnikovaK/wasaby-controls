/// <amd-module name="File/utils/filter" />
import ExtensionsHelper = require("File/utils/ExtensionsHelper");
import ExtensionsError = require("File/Error/Extension");
import MaxSizeError = require("File/Error/MaxSize");

const KB = 1024;
const MB = KB * KB;

type FilterParams = {
    maxSize: number;
    extensions: ExtensionsHelper
}
/**
 * @typedef {Object} FilterParams Параметры фильтрации
 * @property {Number} maxSize Максимальный допустимый размер файла (в МБ)
 * @property {File/utils/ExtensionsHelper} extensions Экземпляр класса для работы с типами файлов
 */

/**
 * Функция фильтрации набора файлов по параметрам.
 * Возвращает массив из прошедших фильтрацию файлов и типизированных ошибок, по непрошедшим
 * @function
 * @param {FileList | Array.<Blob>} Набор фильтруемых файлов
 * @param {FilterParams} Параметры фильтрации
 * @return Array.<Error | File>
 * @name File/utils/filter
 * @public
 * @author Заляев А.В.
 */
export = (
    fileList: FileList | Array<Blob>, {
        extensions,
        maxSize = 0
    }: Partial<FilterParams>
): Array<Error | File> => {
    let files = [];
    maxSize = maxSize * MB;

    /*
     * Нельзя обходить FileList через "for in" + ".hasOwnProperty"
     * https://w3c.github.io/FileAPI/#filelist-section
     * Обход надо делать только по числовому индексу и получать через FileList.item({Number}) или FileList[{Number}]
     */
    for (let i = 0; i < fileList.length; i++) {
        let file = fileList.item? fileList.item(i): fileList[i];

        // По типу
        if (extensions && !extensions.verify(file)) {
            files.push(new ExtensionsError(file.name, extensions.toString()));
            continue;
        }

        // По размеру
        if (maxSize && (file.size > maxSize)) {
            files.push(new MaxSizeError(file.name, maxSize));
            continue;
        }

        files.push(file);
    }
    return files;
}
