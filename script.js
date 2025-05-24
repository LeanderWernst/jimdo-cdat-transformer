(() => {
    const $ = sel => document.querySelector(sel);

    function escapeCDATA(str) {
        // escape ]]>
        return str.replace(/]]>/g, ']]]]><![CDATA[>');
    }

    function wrapContent(html, dismissClosing, insertDiv) {
        let wrapped = '<![CDATA[';
        if (insertDiv) {
            wrapped += '<div>\n';
        } else {
            wrapped += '\n';
        }
        wrapped += escapeCDATA(html) + '\n';

        wrapped += dismissClosing ? '<![CDATA[]]>' : ']]>';
        return wrapped;
    }

    function process() {
        let input = $('#inputHtml').value;
        // remove HTML comments
        input = input.replace(/<!--([\s\S]*?)-->/g, '');

        // extract head
        const styleRe = /<style[\s\S]*?<\/style>/gi;
        const linkRe = /<link\b[^>]*>/gi;
        const headParts = [
            ...Array.from(input.matchAll(styleRe), m => m[0]),
            ...Array.from(input.matchAll(linkRe), m => m[0])
        ];
        const headHtml = headParts.join('\n');
        let bodyHtml = input.replace(styleRe, '').replace(linkRe, '').trim();

        // extract script tags
        const scriptRe = /<script\b[\s\S]*?<\/script>/gi;
        const scripts = [];
        bodyHtml = bodyHtml.replace(scriptRe, (match) => {
            const openEnd = match.indexOf('>') + 1;
            const openTag = match.slice(0, openEnd);
            const inner = match.slice(openEnd, -('</script>'.length));

            const wrapped = openTag
                + '\n//<![CDATA[\n'
                + escapeCDATA(inner)
                + '\n//]]>\n'
                + '</script>';
            scripts.push(wrapped);
            return '';
        }).trim();

        // wrap body w/o scripts
        const dismiss = $('#chkDismissClosing').checked;
        const insertDiv = $('#chkInsertDiv').checked;
        const wrappedBody = wrapContent(bodyHtml, dismiss, insertDiv);

        // append scripts
        const finalBody = scripts.length
            ? wrappedBody + '\n' + scripts.join('\n')
            : wrappedBody;

        // set content
        $('#headResult').textContent = headHtml;
        $('#bodyResult').textContent = finalBody;
    }

    function copyHandler(e) {
        const targetId = e.currentTarget.dataset.target;
        const txt = document.getElementById(targetId).textContent;
        navigator.clipboard.writeText(txt)
            .then(() => alert('In die Zwischenablage kopiert!'))
            .catch(() => alert('Fehler beim Kopieren'));
    }

    $('#btnProcess').addEventListener('click', process);
    document.querySelectorAll('.btnCopy').forEach(btn =>
        btn.addEventListener('click', copyHandler)
    );
})();