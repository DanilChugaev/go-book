import{_ as s,c as a,a as e,o as i}from"./app-DTiWQl8N.js";const l={};function p(t,n){return i(),a("div",null,[...n[0]||(n[0]=[e(`<h1 id="практика" tabindex="-1"><a class="header-anchor" href="#практика"><span>Практика</span></a></h1><h2 id="задание-1" tabindex="-1"><a class="header-anchor" href="#задание-1"><span>Задание 1</span></a></h2><div class="hint-container info"><p class="hint-container-title">Описание</p><p>Объявите переменные для имени (<code>string</code>), возраста (<code>int</code>) и роста (<code>float64</code>). Используйте разный формат объявления. Выведите все переменные.</p></div><p><strong>Цель</strong>: Освоить синтаксис объявления и понять zero values.</p><details><summary>Ответ</summary><p>Что нужно сделать:</p><ul><li>Создайте файл variables.go</li></ul><div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre><code><span class="line"><span class="token keyword">package</span> main</span>
<span class="line"></span>
<span class="line"><span class="token keyword">import</span> <span class="token punctuation">(</span></span>
<span class="line">	<span class="token string">&quot;fmt&quot;</span></span>
<span class="line"><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">const</span> name <span class="token builtin">string</span> <span class="token operator">=</span> <span class="token string">&quot;Danil&quot;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">var</span> age <span class="token builtin">int</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">	age <span class="token operator">=</span> <span class="token number">31</span></span>
<span class="line">	height <span class="token operator">:=</span> <span class="token number">1.75</span></span>
<span class="line"></span>
<span class="line">	fmt<span class="token punctuation">.</span><span class="token function">Printf</span><span class="token punctuation">(</span><span class="token string">&quot;Name: %v, age: %v, height: %v&quot;</span><span class="token punctuation">,</span> name<span class="token punctuation">,</span> age<span class="token punctuation">,</span> height<span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul><li>Запустите</li></ul><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code><span class="line">go run variables.go</span>
<span class="line"></span>
<span class="line"><span class="token comment"># вывод в консоль</span></span>
<span class="line">Name: Danil, age: <span class="token number">31</span>, height: <span class="token number">1.75</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></details><h2 id="задание-2" tabindex="-1"><a class="header-anchor" href="#задание-2"><span>Задание 2</span></a></h2><div class="hint-container info"><p class="hint-container-title">Описание</p><p>Объявите без инициализации: <code>int</code>, <code>bool</code>, <code>string</code>, <code>float64</code>, <code>*int</code>, <code>[]int</code>, <code>map[string]int</code>. Выведите их с fmt.Printf(&quot;%v&quot;).</p></div><p><strong>Цель</strong>: Понять, что Go всегда инициализирует переменные, избегая &quot;мусора&quot;.</p><details><summary>Ответ</summary><p>Что нужно сделать:</p><ul><li>Создайте файл variables.go</li></ul><div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre><code><span class="line"><span class="token keyword">package</span> main</span>
<span class="line"></span>
<span class="line"><span class="token keyword">import</span> <span class="token punctuation">(</span></span>
<span class="line">	<span class="token string">&quot;fmt&quot;</span></span>
<span class="line"><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">var</span> <span class="token punctuation">(</span></span>
<span class="line">	a <span class="token builtin">int</span></span>
<span class="line">	b <span class="token builtin">bool</span></span>
<span class="line">	c <span class="token builtin">string</span></span>
<span class="line">	d <span class="token builtin">float64</span></span>
<span class="line">	e <span class="token operator">*</span><span class="token builtin">int</span></span>
<span class="line">	f <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token builtin">int</span></span>
<span class="line">	g <span class="token keyword">map</span><span class="token punctuation">[</span><span class="token builtin">string</span><span class="token punctuation">]</span><span class="token builtin">int</span></span>
<span class="line"><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">	fmt<span class="token punctuation">.</span><span class="token function">Printf</span><span class="token punctuation">(</span><span class="token string">&quot;%v %v %q %v %v %v %v\\n&quot;</span><span class="token punctuation">,</span> a<span class="token punctuation">,</span> b<span class="token punctuation">,</span> c<span class="token punctuation">,</span> d<span class="token punctuation">,</span> e<span class="token punctuation">,</span> f<span class="token punctuation">,</span> g<span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul><li>Запустите</li></ul><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code><span class="line">go run variables.go</span>
<span class="line"></span>
<span class="line"><span class="token comment"># вывод в консоль</span></span>
<span class="line"><span class="token number">0</span> <span class="token boolean">false</span> <span class="token string">&quot;&quot;</span> <span class="token number">0</span> <span class="token operator">&lt;</span>nil<span class="token operator">&gt;</span> <span class="token punctuation">[</span><span class="token punctuation">]</span> map<span class="token punctuation">[</span><span class="token punctuation">]</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></details><h2 id="задание-3" tabindex="-1"><a class="header-anchor" href="#задание-3"><span>Задание 3</span></a></h2><div class="hint-container info"><p class="hint-container-title">Описание</p><p>Исследуйте диапазоны int8 и uint8, вызвав переполнение.</p></div><p><strong>Цель</strong>: Понять signed/unsigned и поведение при overflow (Go не паникует, но wrap around).</p><details><summary>Ответ</summary><p>Что нужно сделать:</p><ul><li>Создайте файл variables.go</li></ul><div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre><code><span class="line"><span class="token keyword">package</span> main</span>
<span class="line"></span>
<span class="line"><span class="token keyword">import</span> <span class="token punctuation">(</span></span>
<span class="line">	<span class="token string">&quot;fmt&quot;</span></span>
<span class="line"><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">var</span> <span class="token punctuation">(</span></span>
<span class="line">	a <span class="token builtin">int8</span>  <span class="token operator">=</span> <span class="token number">127</span></span>
<span class="line">	b <span class="token builtin">uint8</span> <span class="token operator">=</span> <span class="token number">0</span></span>
<span class="line"><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">	a <span class="token operator">=</span> a <span class="token operator">+</span> <span class="token number">1</span></span>
<span class="line">	b <span class="token operator">=</span> b <span class="token operator">-</span> <span class="token number">1</span></span>
<span class="line">	fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span>a<span class="token punctuation">,</span> b<span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul><li>Запустите</li></ul><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code><span class="line">go run variables.go</span>
<span class="line"></span>
<span class="line"><span class="token comment"># вывод в консоль</span></span>
<span class="line"><span class="token parameter variable">-128</span> <span class="token number">255</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></details><h2 id="задание-4" tabindex="-1"><a class="header-anchor" href="#задание-4"><span>Задание 4</span></a></h2><div class="hint-container info"><p class="hint-container-title">Описание</p><p>Создай константы для любых цветов с помощью iota. Выведите значения.</p></div><p><strong>Цель</strong>: Освоить константы как enum-подобные.</p><details><summary>Ответ</summary><p>Что нужно сделать:</p><ul><li>Создайте файл variables.go</li></ul><div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre><code><span class="line"><span class="token keyword">package</span> main</span>
<span class="line"></span>
<span class="line"><span class="token keyword">import</span> <span class="token punctuation">(</span></span>
<span class="line">	<span class="token string">&quot;fmt&quot;</span></span>
<span class="line"><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">const</span> <span class="token punctuation">(</span></span>
<span class="line">	Red   <span class="token operator">=</span> <span class="token boolean">iota</span> <span class="token comment">// 0</span></span>
<span class="line">	Green        <span class="token comment">// 1</span></span>
<span class="line">	Blue         <span class="token comment">// 2</span></span>
<span class="line"><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">	fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span>Red<span class="token punctuation">,</span> Green<span class="token punctuation">,</span> Blue<span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul><li>Запустите</li></ul><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code><span class="line">go run variables.go</span>
<span class="line"></span>
<span class="line"><span class="token comment"># вывод в консоль</span></span>
<span class="line"><span class="token number">0</span> <span class="token number">1</span> <span class="token number">2</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></details><h2 id="задание-5" tabindex="-1"><a class="header-anchor" href="#задание-5"><span>Задание 5</span></a></h2><div class="hint-container info"><p class="hint-container-title">Описание</p><p>Напиши 2 функции, которая принимает строку и возвращают число</p><ul><li>первая возвращает количество символов (рун)</li><li>вторая возвращает количество байтов.</li></ul></div><p><strong>Цель</strong>: Освоить разницу byte/rune.</p><details><summary>Ответ</summary><p>Что нужно сделать:</p><ul><li>Создайте файл variables.go</li></ul><div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre><code><span class="line"><span class="token keyword">package</span> main</span>
<span class="line"></span>
<span class="line"><span class="token keyword">import</span> <span class="token punctuation">(</span></span>
<span class="line">	<span class="token string">&quot;fmt&quot;</span></span>
<span class="line">	<span class="token string">&quot;unicode/utf8&quot;</span></span>
<span class="line"><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">countRunes</span><span class="token punctuation">(</span>s <span class="token builtin">string</span><span class="token punctuation">)</span> <span class="token builtin">int</span> <span class="token punctuation">{</span></span>
<span class="line">	<span class="token keyword">return</span> utf8<span class="token punctuation">.</span><span class="token function">RuneCountInString</span><span class="token punctuation">(</span>s<span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">countBytes</span><span class="token punctuation">(</span>s <span class="token builtin">string</span><span class="token punctuation">)</span> <span class="token builtin">int</span> <span class="token punctuation">{</span></span>
<span class="line">	<span class="token keyword">return</span> <span class="token function">len</span><span class="token punctuation">(</span>s<span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">	str <span class="token operator">:=</span> <span class="token string">&quot;Привет, мир!&quot;</span></span>
<span class="line"></span>
<span class="line">	runes <span class="token operator">:=</span> <span class="token function">countRunes</span><span class="token punctuation">(</span>str<span class="token punctuation">)</span></span>
<span class="line">	bytes <span class="token operator">:=</span> <span class="token function">countBytes</span><span class="token punctuation">(</span>str<span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line">	fmt<span class="token punctuation">.</span><span class="token function">Printf</span><span class="token punctuation">(</span><span class="token string">&quot;Количество рун: %d\\n&quot;</span><span class="token punctuation">,</span> runes<span class="token punctuation">)</span></span>
<span class="line">	fmt<span class="token punctuation">.</span><span class="token function">Printf</span><span class="token punctuation">(</span><span class="token string">&quot;Количество байтов: %d\\n&quot;</span><span class="token punctuation">,</span> bytes<span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul><li>Запустите</li></ul><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code><span class="line">go run variables.go</span>
<span class="line"></span>
<span class="line"><span class="token comment"># вывод в консоль</span></span>
<span class="line">Количество рун: <span class="token number">12</span></span>
<span class="line">Количество байтов: <span class="token number">21</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></details>`,21)])])}const o=s(l,[["render",p]]),u=JSON.parse('{"path":"/guide/variables-and-data-types/practice.html","title":"Практика","lang":"ru-RU","frontmatter":{},"headers":[{"level":2,"title":"Задание 1","slug":"задание-1","link":"#задание-1","children":[]},{"level":2,"title":"Задание 2","slug":"задание-2","link":"#задание-2","children":[]},{"level":2,"title":"Задание 3","slug":"задание-3","link":"#задание-3","children":[]},{"level":2,"title":"Задание 4","slug":"задание-4","link":"#задание-4","children":[]},{"level":2,"title":"Задание 5","slug":"задание-5","link":"#задание-5","children":[]}],"git":{"updatedTime":1768734106000,"contributors":[{"name":"Danil Chugaev","username":"","email":"dmchugaev@gmail.com","commits":1}],"changelog":[{"hash":"cf9112d1d5152847ea6d12fa4445845f0de3fcc6","time":1768734106000,"email":"dmchugaev@gmail.com","author":"Danil Chugaev","message":"adds practice for pointers"}]},"filePathRelative":"guide/variables-and-data-types/practice.md"}');export{o as comp,u as data};
