import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			typography: {
				DEFAULT: {
					css: {
						'--tw-prose-body': 'hsl(var(--foreground))',
						'--tw-prose-headings': 'hsl(var(--foreground))',
						'--tw-prose-lead': 'hsl(var(--muted-foreground))',
						'--tw-prose-links': 'hsl(var(--primary))',
						'--tw-prose-bold': 'hsl(var(--foreground))',
						'--tw-prose-counters': 'hsl(var(--foreground))',
						'--tw-prose-bullets': 'hsl(var(--foreground))',
						'--tw-prose-hr': 'hsl(var(--border))',
						'--tw-prose-quotes': 'hsl(var(--foreground))',
						'--tw-prose-quote-borders': 'hsl(var(--border))',
						'--tw-prose-captions': 'hsl(var(--muted-foreground))',
						'--tw-prose-code': 'hsl(var(--foreground))',
						'--tw-prose-pre-code': 'hsl(var(--foreground))',
						'--tw-prose-pre-bg': 'hsl(var(--muted))',
						'--tw-prose-th-borders': 'hsl(var(--border))',
						'--tw-prose-td-borders': 'hsl(var(--border))',
						// Dark mode
						'--tw-prose-invert-body': 'hsl(var(--foreground))',
						'--tw-prose-invert-headings': 'hsl(var(--foreground))',
						'--tw-prose-invert-lead': 'hsl(var(--muted-foreground))',
						'--tw-prose-invert-links': 'hsl(var(--primary))',
						'--tw-prose-invert-bold': 'hsl(var(--foreground))',
						'--tw-prose-invert-counters': 'hsl(var(--foreground))',
						'--tw-prose-invert-bullets': 'hsl(var(--foreground))',
						'--tw-prose-invert-hr': 'hsl(var(--border))',
						'--tw-prose-invert-quotes': 'hsl(var(--foreground))',
						'--tw-prose-invert-quote-borders': 'hsl(var(--border))',
						'--tw-prose-invert-captions': 'hsl(var(--muted-foreground))',
						'--tw-prose-invert-code': 'hsl(var(--foreground))',
						'--tw-prose-invert-pre-code': 'hsl(var(--foreground))',
						'--tw-prose-invert-pre-bg': 'hsl(var(--muted))',
						'--tw-prose-invert-th-borders': 'hsl(var(--border))',
						'--tw-prose-invert-td-borders': 'hsl(var(--border))',
						// Base styles
						maxWidth: 'none',
						color: 'var(--tw-prose-body)',
						fontSize: '1rem',
						lineHeight: '1.75',
						p: {
							marginTop: '1.25em',
							marginBottom: '1.25em'
						},
						'[class~="lead"]': {
							color: 'var(--tw-prose-lead)'
						},
						a: {
							color: 'var(--tw-prose-links)',
							textDecoration: 'underline',
							fontWeight: '500'
						},
						strong: {
							color: 'var(--tw-prose-bold)',
							fontWeight: '600'
						},
						'ol[type="A"]': {
							'--list-counter-style': 'upper-alpha'
						},
						'ol[type="a"]': {
							'--list-counter-style': 'lower-alpha'
						},
						'ol[type="A" s]': {
							'--list-counter-style': 'upper-alpha'
						},
						'ol[type="a" s]': {
							'--list-counter-style': 'lower-alpha'
						},
						'ol[type="I"]': {
							'--list-counter-style': 'upper-roman'
						},
						'ol[type="i"]': {
							'--list-counter-style': 'lower-roman'
						},
						'ol[type="I" s]': {
							'--list-counter-style': 'upper-roman'
						},
						'ol[type="i" s]': {
							'--list-counter-style': 'lower-roman'
						},
						'ol[type="1"]': {
							'--list-counter-style': 'decimal'
						},
						'ol > li': {
							position: 'relative',
							paddingLeft: '1.75em',
							marginTop: '0.5em',
							marginBottom: '0.5em'
						},
						'ol > li::before': {
							content: 'counter(list-item, var(--list-counter-style, decimal)) "."',
							position: 'absolute',
							left: '0',
							color: 'var(--tw-prose-counters)'
						},
						'ul > li': {
							position: 'relative',
							paddingLeft: '1.75em',
							marginTop: '0.5em',
							marginBottom: '0.5em'
						},
						'ul > li::before': {
							content: '""',
							position: 'absolute',
							left: '0.375em',
							top: '0.6875em',
							height: '0.375em',
							width: '0.375em',
							borderRadius: '50%',
							backgroundColor: 'var(--tw-prose-bullets)'
						},
						'ul ul, ul ol, ol ul, ol ol': {
							marginTop: '0.75em',
							marginBottom: '0.75em'
						},
						hr: {
							marginTop: '3em',
							marginBottom: '3em',
							borderTopWidth: '1px',
							borderColor: 'var(--tw-prose-hr)',
							width: '100%'
						},
						blockquote: {
							fontWeight: '500',
							fontStyle: 'italic',
							color: 'var(--tw-prose-quotes)',
							borderLeftWidth: '0.25rem',
							borderLeftColor: 'var(--tw-prose-quote-borders)',
							quotes: '"\\201C""\\201D""\\2018""\\2019"',
							marginTop: '1.6em',
							marginBottom: '1.6em',
							paddingLeft: '1em'
						},
						h1: {
							color: 'var(--tw-prose-headings)',
							fontWeight: '800',
							fontSize: '2.25em',
							marginTop: '0',
							marginBottom: '0.8888889em',
							lineHeight: '1.1111111'
						},
						h2: {
							color: 'var(--tw-prose-headings)',
							fontWeight: '700',
							fontSize: '1.5em',
							marginTop: '2em',
							marginBottom: '1em',
							lineHeight: '1.3333333'
						},
						h3: {
							color: 'var(--tw-prose-headings)',
							fontWeight: '600',
							fontSize: '1.25em',
							marginTop: '1.6em',
							marginBottom: '0.6em',
							lineHeight: '1.6'
						},
						h4: {
							color: 'var(--tw-prose-headings)',
							fontWeight: '600',
							marginTop: '1.5em',
							marginBottom: '0.5em',
							lineHeight: '1.5'
						},
						img: {
							marginTop: '2em',
							marginBottom: '2em'
						},
						picture: {
							marginTop: '2em',
							marginBottom: '2em'
						},
						'picture > img': {
							marginTop: '0',
							marginBottom: '0'
						},
						video: {
							marginTop: '2em',
							marginBottom: '2em'
						},
						kbd: {
							fontSize: '0.875em',
							fontWeight: '600',
							fontFamily: 'inherit',
							color: 'var(--tw-prose-code)',
							backgroundColor: 'var(--tw-prose-pre-bg)',
							padding: '0.1666667em 0.4166667em',
							borderRadius: '0.25rem'
						},
						code: {
							color: 'var(--tw-prose-code)',
							backgroundColor: 'var(--tw-prose-pre-bg)',
							paddingLeft: '0.4em',
							paddingRight: '0.4em',
							paddingTop: '0.2em',
							paddingBottom: '0.2em',
							borderRadius: '0.25rem',
							fontWeight: '400',
							fontSize: '0.875em',
							fontFamily: 'var(--font-mono)',
							'&::before': {
								content: '""'
							},
							'&::after': {
								content: '""'
							}
						},
						'a code': {
							color: 'inherit'
						},
						'h1 code': {
							color: 'inherit'
						},
						'h2 code': {
							color: 'inherit'
						},
						'h3 code': {
							color: 'inherit'
						},
						'h4 code': {
							color: 'inherit'
						},
						'blockquote code': {
							color: 'inherit'
						},
						'thead th code': {
							color: 'inherit'
						},
						pre: {
							color: 'var(--tw-prose-pre-code)',
							backgroundColor: 'transparent',
							overflowX: 'auto',
							fontWeight: '400',
							fontSize: '0.875em',
							lineHeight: '1.7142857',
							margin: '0',
							padding: '0',
							'> code': {
								backgroundColor: 'transparent',
								borderWidth: '0',
								borderRadius: '0',
								padding: '0',
								fontWeight: 'inherit',
								color: 'inherit',
								fontSize: 'inherit',
								fontFamily: 'inherit',
								lineHeight: 'inherit',
								'&::before': {
									content: 'none'
								},
								'&::after': {
									content: 'none'
								}
							}
						},
						table: {
							width: '100%',
							tableLayout: 'auto',
							textAlign: 'left',
							marginTop: '2em',
							marginBottom: '2em'
						},
						thead: {
							borderBottomWidth: '1px',
							borderBottomColor: 'var(--tw-prose-th-borders)'
						},
						'thead th': {
							color: 'var(--tw-prose-headings)',
							fontWeight: '600',
							verticalAlign: 'bottom',
							paddingRight: '0.5714286em',
							paddingBottom: '0.5714286em',
							paddingLeft: '0.5714286em'
						},
						'tbody tr': {
							borderBottomWidth: '1px',
							borderBottomColor: 'var(--tw-prose-td-borders)'
						},
						'tbody tr:last-child': {
							borderBottomWidth: '0'
						},
						'tbody td': {
							verticalAlign: 'baseline'
						},
						tfoot: {
							borderTopWidth: '1px',
							borderTopColor: 'var(--tw-prose-th-borders)'
						},
						'tfoot td': {
							verticalAlign: 'top'
						},
						':is(tbody, tfoot) td': {
							paddingTop: '0.5714286em',
							paddingRight: '0.5714286em',
							paddingBottom: '0.5714286em',
							paddingLeft: '0.5714286em'
						}
					}
				}
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		require("@tailwindcss/typography")
	],
} satisfies Config;
