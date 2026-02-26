/**
 * 搜索和排序模块
 * 包含搜索和排序密钥的功能
 */

/**
 * 获取搜索和排序相关代码
 * @returns {string} 搜索 JavaScript 代码
 */
export function getSearchCode() {
	return `    // ========== 搜索和排序模块 ==========

    // 排序相关变量
    let currentSortType = 'oldest-first';
    let currentCategoryFilter = '';

    // 从 localStorage 恢复排序选择
    function restoreSortPreference() {
      try {
        const savedSort = localStorage.getItem('2fa-sort-preference');
        if (savedSort) {
          currentSortType = savedSort;
          const sortSelect = document.getElementById('sortSelect');
          if (sortSelect) {
            sortSelect.value = savedSort;
          }
          console.log('✅ 已恢复排序设置:', savedSort);
        }
      } catch (e) {
        console.warn('⚠️  恢复排序设置失败:', e);
      }
    }

    // 保存排序选择到 localStorage
    function saveSortPreference(sortType) {
      try {
        localStorage.setItem('2fa-sort-preference', sortType);
        console.log('💾 已保存排序设置:', sortType);
      } catch (e) {
        console.warn('⚠️  保存排序设置失败:', e);
      }
    }

    // 更新分类下拉列表
    function updateCategoryFilter() {
      const categoryFilter = document.getElementById('categoryFilter');
      const categorySuggestions = document.getElementById('categorySuggestions');
      if (!categoryFilter) return;

      // 收集所有分类
      const categories = new Set();
      secrets.forEach(secret => {
        if (secret.category && secret.category.trim()) {
          categories.add(secret.category.trim());
        }
      });

      // 保存当前选中的分类
      const currentValue = categoryFilter.value;

      // 重新生成选项
      let options = '<option value="">全部分类</option>';
      let datalistOptions = '';
      Array.from(categories).sort().forEach(cat => {
        options += '<option value="' + cat + '">' + cat + '</option>';
        datalistOptions += '<option value="' + cat + '">';
      });
      categoryFilter.innerHTML = options;

      // 更新 datalist 用于输入建议
      if (categorySuggestions) {
        categorySuggestions.innerHTML = datalistOptions;
      }

      // 恢复选中的分类（如果仍然存在）
      if (currentValue && categories.has(currentValue)) {
        categoryFilter.value = currentValue;
      }
    }

    // 分类过滤功能
    async function filterByCategory(category) {
      currentCategoryFilter = category;
      await applyFilters();
    }

    // 应用搜索和分类过滤
    async function applyFilters() {
      const searchInput = document.getElementById('searchInput');
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      currentSearchQuery = query;

      const searchClear = document.getElementById('searchClear');
      const searchStats = document.getElementById('searchStats');

      if (query) {
        searchClear.style.display = 'block';
      } else {
        searchClear.style.display = 'none';
      }

      // 先按分类过滤
      let result = secrets;
      if (currentCategoryFilter) {
        result = result.filter(secret => secret.category === currentCategoryFilter);
      }

      // 再按搜索词过滤
      if (query) {
        result = result.filter(secret => {
          const serviceName = secret.name.toLowerCase();
          const accountName = (secret.account || '').toLowerCase();
          const categoryName = (secret.category || '').toLowerCase();
          return serviceName.includes(query) || accountName.includes(query) || categoryName.includes(query);
        });
      }

      filteredSecrets = result;

      if (searchStats) {
        const totalCount = secrets.length;
        const foundCount = filteredSecrets.length;

        if (foundCount === 0) {
          searchStats.textContent = '未找到匹配的密钥';
          searchStats.style.color = '#e74c3c';
        } else if (foundCount === totalCount && !currentCategoryFilter) {
          searchStats.textContent = '显示所有 ' + totalCount + ' 个密钥';
          searchStats.style.color = '#27ae60';
        } else {
          searchStats.textContent = '找到 ' + foundCount + ' 个匹配密钥（共 ' + totalCount + ' 个）';
          searchStats.style.color = '#3498db';
        }
        searchStats.style.display = 'block';
      }

      await renderFilteredSecrets();
    }

    // 搜索过滤功能
    async function filterSecrets(query) {
      await applyFilters();
    }

    // 清除搜索
    function clearSearch() {
      document.getElementById('searchInput').value = '';
      applyFilters();
      document.getElementById('searchInput').focus();
    }

    // 应用排序
    async function applySorting() {
      const sortSelect = document.getElementById('sortSelect');
      currentSortType = sortSelect.value;
      
      // 保存用户的排序选择
      saveSortPreference(currentSortType);
      
      await renderFilteredSecrets();
    }

    // 排序密钥
    function sortSecrets(secretsToSort, sortType) {
      if (!secretsToSort || secretsToSort.length === 0) {
        return secretsToSort;
      }

      const sortedSecrets = [...secretsToSort];

      switch (sortType) {
        case 'name-asc':
          return sortedSecrets.sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB, 'zh-CN');
          });

        case 'name-desc':
          return sortedSecrets.sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameB.localeCompare(nameA, 'zh-CN');
          });

        case 'account-asc':
          return sortedSecrets.sort((a, b) => {
            const accountA = (a.account || '').toLowerCase();
            const accountB = (b.account || '').toLowerCase();
            return accountA.localeCompare(accountB, 'zh-CN');
          });

        case 'account-desc':
          return sortedSecrets.sort((a, b) => {
            const accountA = (a.account || '').toLowerCase();
            const accountB = (b.account || '').toLowerCase();
            return accountB.localeCompare(accountA, 'zh-CN');
          });

        case 'oldest-first':
          // 最早添加：按添加顺序（保持原有顺序）
          return sortedSecrets;

        case 'newest-first':
          // 最晚添加：按添加顺序倒序
          return sortedSecrets.reverse();

        case 'default':
        default:
          // 兼容旧版本，默认使用最早添加
          return sortedSecrets;
      }
    }
`;
}
