import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { defaultStyles, themeToCssVariables } from './styles'
import { resolveColumns } from './types'
import type { DailymotionGalleryStyles, DailymotionLayoutProps, DailymotionStyleProps } from './types'
import { cx } from './utils'

export interface ShellProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title' | 'onError' | 'onSelect'>,
    Pick<DailymotionStyleProps, 'theme' | 'colorScheme' | 'classNames' | 'styles' | 'unstyled' | 'injectStyles'>,
    Pick<DailymotionLayoutProps, 'layout' | 'columns' | 'variant'> {
  children: ReactNode
}

/** Root element shared by the gallery, playlist and programme components. */
export function Shell({
  layout = 'grid',
  columns,
  variant = 'landscape',
  theme,
  colorScheme = 'light',
  classNames = {},
  styles: slotStyles = {},
  unstyled = false,
  injectStyles = true,
  className,
  style,
  children,
  ...rest
}: ShellProps) {
  const cols = resolveColumns(columns)
  const shouldInject = !unstyled && injectStyles

  const rootStyle = {
    ...(unstyled ? {} : {
      '--dmp-columns': cols.desktop,
      '--dmp-columns-tablet': cols.tablet,
      '--dmp-columns-mobile': cols.mobile,
    }),
    ...themeToCssVariables(theme),
    ...slotStyles.root,
    ...style,
  } as CSSProperties

  return (
    <section
      className={cx(unstyled ? undefined : 'dmp-root', classNames.root, className)}
      style={rootStyle}
      data-dmp-layout={layout}
      data-dmp-variant={variant}
      data-dmp-scheme={colorScheme}
      {...(unstyled ? { 'data-dmp-unstyled': '' } : {})}
      {...rest}
    >
      {shouldInject ? (
        <style data-dmp-styles="" dangerouslySetInnerHTML={{ __html: defaultStyles }} />
      ) : null}
      {children}
    </section>
  )
}

