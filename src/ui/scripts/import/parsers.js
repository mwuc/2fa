/**
 * 导入解析器模块
 * 包含各种格式的解析函数（CSV、HTML、JSON等）
 */

/**
 * 获取CSV解析器代码
 * @returns {string} JavaScript 代码
 */
export function getCSVParserCode() {
	return `
    // ========== CSV 解析器 ==========

    /**
     * 解析CSV格式的导入数据
     * 支持2FA导出的CSV格式和Bitwarden Authenticator CSV格式
     * @param {string} csvContent - CSV内容
     * @returns {Array} - 包含完整数据的对象数组（包括 category）
     */
    function parseCSVImport(csvContent) {
      const parsedItems = [];

      try {
        // 按行分割
        const lines = csvContent.split('\\n').filter(line => line.trim());

        if (lines.length < 2) {
          console.warn('CSV文件内容太少');
          return parsedItems;
        }

        // 检查第一行是否是标题行
        const header = lines[0];

        // 检测 Bitwarden Authenticator CSV 格式: folder,favorite,type,name,login_uri,login_totp
        if (header.includes('login_totp') && header.includes('folder')) {
          console.log('检测到 Bitwarden Authenticator CSV 格式');

          for (let i = 1; i < lines.length; i++) {
            try {
              const line = lines[i].trim();
              if (!line) continue;

              // 查找 otpauth:// URL
              const otpauthMatch = line.match(/otpauth:\\/\\/[^,\\s]+/);
              if (otpauthMatch) {
                const url = new URL(decodeURIComponent(otpauthMatch[0]));
                const issuer = url.searchParams.get('issuer') || '';
                const secret = url.searchParams.get('secret') || '';
                const pathParts = decodeURIComponent(url.pathname.substring(1)).split(':');
                const account = pathParts.length > 1 ? pathParts.slice(1).join(':') : '';

                parsedItems.push({
                  otpauthUrl: decodeURIComponent(otpauthMatch[0]),
                  serviceName: issuer,
                  account: account,
                  secret: secret,
                  type: 'totp',
                  digits: parseInt(url.searchParams.get('digits')) || 6,
                  period: parseInt(url.searchParams.get('period')) || 30,
                  algorithm: url.searchParams.get('algorithm') || 'SHA1',
                  counter: 0,
                  category: ''
                });
                console.log('Bitwarden Auth CSV 第', i + 1, '行解析成功');
              }
            } catch (err) {
              console.error('解析 Bitwarden Auth CSV 第', i + 1, '行失败:', err);
            }
          }

          console.log('成功从 Bitwarden Authenticator CSV 解析', parsedItems.length, '条密钥');
          return parsedItems;
        }

        // 原有的 2FA CSV 格式检测
        const isCSVFormat = header.includes('服务名称') || header.includes('密钥') ||
                           header.toLowerCase().includes('service') || header.toLowerCase().includes('secret');

        if (!isCSVFormat) {
          console.warn('不是有效的CSV格式');
          return parsedItems;
        }

        // 解析标题行，确定列的索引
        const headers = parseCSVLine(header);
        const serviceIndex = headers.findIndex(h => h === '服务名称' || h.toLowerCase() === 'service');
        const accountIndex = headers.findIndex(h => h === '账户信息' || h === '账户' || h.toLowerCase() === 'account');
        const secretIndex = headers.findIndex(h => h === '密钥' || h.toLowerCase() === 'secret');
        const typeIndex = headers.findIndex(h => h === '类型' || h.toLowerCase() === 'type');
        const digitsIndex = headers.findIndex(h => h === '位数' || h.toLowerCase() === 'digits');
        const periodIndex = headers.findIndex(h => h.includes('周期') || h.toLowerCase().includes('period'));
        const algoIndex = headers.findIndex(h => h === '算法' || h.toLowerCase() === 'algorithm');
        const categoryIndex = headers.findIndex(h => h === '分类' || h.toLowerCase() === 'category');

        console.log('CSV列索引:', { serviceIndex, accountIndex, secretIndex, typeIndex, digitsIndex, periodIndex, algoIndex, categoryIndex });

        // 解析数据行（跳过标题行）
        for (let i = 1; i < lines.length; i++) {
          try {
            const line = lines[i].trim();
            if (!line) continue;

            const fields = parseCSVLine(line);

            const service = serviceIndex >= 0 ? fields[serviceIndex] : '';
            const account = accountIndex >= 0 ? fields[accountIndex] : '';
            const secret = secretIndex >= 0 ? fields[secretIndex] : '';
            const type = typeIndex >= 0 ? fields[typeIndex] : 'TOTP';
            const digits = digitsIndex >= 0 ? parseInt(fields[digitsIndex]) || 6 : 6;
            const period = periodIndex >= 0 ? parseInt(fields[periodIndex]) || 30 : 30;
            const algo = algoIndex >= 0 ? fields[algoIndex] : 'SHA1';
            const category = categoryIndex >= 0 ? fields[categoryIndex] : '';

            // 验证必要数据
            if (!secret || !secret.trim()) {
              console.warn('第', i + 1, '行：跳过空密钥');
              continue;
            }

            // 清理密钥
            const cleanSecret = secret.replace(/\\s+/g, '').toUpperCase();

            // 构建 otpauth:// URL
            let label = '';
            if (service && account) {
              label = encodeURIComponent(service) + ':' + encodeURIComponent(account);
            } else if (service) {
              label = encodeURIComponent(service);
            } else if (account) {
              label = encodeURIComponent(account);
            } else {
              label = 'Unknown';
            }

            const params = new URLSearchParams();
            params.set('secret', cleanSecret);
            if (service) params.set('issuer', service);
            if (digits !== 6) params.set('digits', digits);
            if (period !== 30) params.set('period', period);
            if (algo !== 'SHA1') params.set('algorithm', algo);

            const otpauthUrl = 'otpauth://totp/' + label + '?' + params.toString();

            // 返回包含完整数据的对象，包括 category
            parsedItems.push({
              otpauthUrl: otpauthUrl,
              serviceName: service,
              account: account,
              secret: cleanSecret,
              type: 'totp',
              digits: digits,
              period: period,
              algorithm: algo,
              counter: 0,
              category: category
            });

            console.log('CSV第', i + 1, '行解析成功:', service, account, category ? '(分类: ' + category + ')' : '');

          } catch (err) {
            console.error('解析CSV第', i + 1, '行失败:', err);
          }
        }

        console.log('成功从CSV解析', parsedItems.length, '条密钥');

      } catch (error) {
        console.error('解析CSV失败:', error);
      }

      return parsedItems;
    }
`;
}

/**
 * 获取JSON解析器代码（LastPass等格式）
 * @returns {string} JavaScript 代码
 */
export function getJSONParserCode() {
	return `
    // ========== JSON 解析器 ==========

    /**
     * 解析各种 JSON 格式的导入数据
     * @param {Object|Array} jsonData - JSON数据
     * @returns {Array} - 对象数组（含 category）或字符串数组（otpauth URL）
     */
    function parseJsonImport(jsonData) {
      const otpauthUrls = [];

      // 检测 2FA 导出格式: { secrets: [...] }
      if (jsonData.secrets && Array.isArray(jsonData.secrets)) {
        console.log('检测到 2FA JSON 导出格式, 共', jsonData.secrets.length, '条');

        const parsedItems = [];

        jsonData.secrets.forEach((secret, index) => {
          try {
            // 清理密钥中的空格
            const secretKey = (secret.secret || '').replace(/\\s+/g, '').toUpperCase();
            
            const issuer = secret.issuer || secret.name || '';
            const account = secret.account || '';
            const type = (secret.type || 'TOTP').toLowerCase();
            const digits = secret.digits || 6;
            const period = secret.period || 30;
            const algorithm = (secret.algorithm || 'SHA1').toUpperCase();
            const counter = secret.counter || 0;
            const category = secret.category || '';

            // 构建 otpauth:// URL
            let label = '';
            if (issuer && account) {
              label = encodeURIComponent(issuer) + ':' + encodeURIComponent(account);
            } else if (issuer) {
              label = encodeURIComponent(issuer);
            } else if (account) {
              label = encodeURIComponent(account);
            } else {
              label = 'Unknown';
            }

            const params = new URLSearchParams();
            params.set('secret', secretKey);
            if (issuer) params.set('issuer', issuer);
            if (digits !== 6) params.set('digits', digits);
            if (period !== 30) params.set('period', period);
            if (algorithm !== 'SHA1') params.set('algorithm', algorithm);
            if (type === 'hotp') params.set('counter', counter);

            const otpauthUrl = 'otpauth://' + type + '/' + label + '?' + params.toString();

            // 返回包含完整数据的对象，包括 category
            parsedItems.push({
              otpauthUrl: otpauthUrl,
              serviceName: issuer,
              account: account,
              secret: secretKey,
              type: type,
              digits: digits,
              period: period,
              algorithm: algorithm,
              counter: counter,
              category: category
            });

          } catch (err) {
            console.error('解析 2FA JSON 条目失败 (索引 ' + index + '):', err);
          }
        });

        console.log('成功解析 2FA JSON 格式,共 ' + parsedItems.length + ' 条');
        return parsedItems;
      }

      // 检测 LastPass JSON 格式
      if (jsonData.version !== undefined &&
          jsonData.accounts &&
          Array.isArray(jsonData.accounts) &&
          jsonData.accounts.length > 0) {

        const firstAccount = jsonData.accounts[0];
        if (firstAccount.issuerName !== undefined &&
            firstAccount.timeStep !== undefined &&
            (firstAccount.secret !== undefined || firstAccount.pushNotification !== undefined)) {
          console.log('检测到 LastPass Authenticator 格式');
          return parseLastPassJSON(jsonData);
        }
      }

      // 其他格式返回空数组
      console.log('未识别的JSON格式');
      return otpauthUrls;
    }

    /**
     * 解析 LastPass JSON 格式
     * @param {Object} jsonData - JSON 数据
     * @returns {Array<string>} otpauth:// URL 数组
     */
    function parseLastPassJSON(jsonData) {
      const otpauthUrls = [];

      try {
        // LastPass JSON 结构: { accounts: [...] }
        const accounts = jsonData.accounts || [];

        accounts.forEach((account, index) => {
          try {
            // LastPass 账户结构
            const issuer = account.issuerName || account.issuer || '';
            const name = account.userName || account.name || '';
            const secret = account.secret || '';
            const digits = account.digits || 6;
            const period = account.timeStep || account.period || 30;
            const algo = account.algorithm || 'SHA1';

            if (!secret) {
              console.warn('跳过无密钥的 LastPass 条目 (索引 ' + index + ')');
              return;
            }

            // 清理密钥
            const cleanSecret = secret.replace(/\\s+/g, '').toUpperCase();

            // 构建 otpauth:// URL
            let label = '';
            if (issuer && name) {
              label = encodeURIComponent(issuer) + ':' + encodeURIComponent(name);
            } else if (issuer) {
              label = encodeURIComponent(issuer);
            } else if (name) {
              label = encodeURIComponent(name);
            } else {
              label = 'Unknown';
            }

            const params = new URLSearchParams();
            params.set('secret', cleanSecret);
            if (issuer) params.set('issuer', issuer);
            if (digits !== 6) params.set('digits', digits);
            if (period !== 30) params.set('period', period);
            if (algo !== 'SHA1') params.set('algorithm', algo);

            const otpauthUrl = 'otpauth://totp/' + label + '?' + params.toString();
            otpauthUrls.push(otpauthUrl);

            console.log('LastPass 条目 ' + (index + 1) + ':', issuer, name);
          } catch (err) {
            console.error('解析 LastPass 条目失败 (索引 ' + index + '):', err);
          }
        });

        console.log('成功解析 LastPass 格式，共 ' + otpauthUrls.length + ' 条');
      } catch (error) {
        console.error('解析 LastPass JSON 失败:', error);
      }

      return otpauthUrls;
    }
`;
}
