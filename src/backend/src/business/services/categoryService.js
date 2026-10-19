// CategoryService – FR6: danh mục nhóm sự cố đang hoạt động kèm mức ưu tiên mặc định (QT-A1).
function createCategoryService({ categoryRepo }) {
  return { listActive: () => categoryRepo.findAllActive() };
}

module.exports = { createCategoryService };
