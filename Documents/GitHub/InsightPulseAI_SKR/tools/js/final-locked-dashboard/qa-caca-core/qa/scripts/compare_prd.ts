import fs from 'fs';
import yaml from 'js-yaml';

const [prdPath, htmlPath] = process.argv.slice(2);

const prd = yaml.load(fs.readFileSync(prdPath, 'utf8')) as any;
const html = fs.readFileSync(`${htmlPath}/index.html`, 'utf8');

const results = {
  prdTitleMatch: html.includes(prd.title),
  hasFilterBar: html.includes('filter'),
  hasKpis: html.includes('KPI'),
};

fs.writeFileSync('qa/tmp/report.yaml', yaml.dump(results));
console.log('✅ PRD QA comparison complete: qa/tmp/report.yaml');