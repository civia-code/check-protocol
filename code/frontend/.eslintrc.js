module.exports = {
    extends: ['next/core-web-vitals', 'plugin:react/recommended', 'standard', 'eslint:recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    globals: {
        location: 'readonly',
        chrome: 'readonly',
        JSX: 'readonly'
    },
    plugins: ['react', '@typescript-eslint', 'react-hooks'],
    settings: {
        react: {
            version: 'detect'
        }
    },
    rules: {
        'react/self-closing-comp': ['error'],
        'react/prop-types': 'off',
        'react/no-typos': 'error',
        'react/react-in-jsx-scope': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/display-name': 'off',
        'promise/param-names': 'off',
        'react/jsx-boolean-value': 'off',
        'react/jsx-closing-bracket-location': [
            'error',
            {
                nonEmpty: false,
                selfClosing: 'line-aligned'
            }
        ],
        'react/jsx-curly-spacing': [
            'error',
            {
                when: 'never',
                attributes: {
                    allowMultiline: true
                },
                children: true,
                spacing: {
                    objectLiterals: 'never'
                }
            }
        ],
        'react/jsx-equals-spacing': [
            'error',
            'never'
        ],
        'react/jsx-tag-spacing': [
            'error',
            {
                closingSlash: 'never',
                beforeSelfClosing: 'always',
                afterOpening: 'never'
            }
        ],
        '@typescript-eslint/indent': [1, 4, { ObjectExpression: 'first', ArrayExpression: 'first', VariableDeclarator: 'first' }],
        camelcase: [1],
        'no-unused-vars': [0],
        indent: [1, 4],
        semi: [1, 'always'],
        'multiline-ternary': [0],
        'no-return-assign': [0],
        'n/no-callback-literal': [0],
        'no-template-curly-in-string': [0],
        'no-use-before-define': 0
    }
};
