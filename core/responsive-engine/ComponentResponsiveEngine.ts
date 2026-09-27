export interface ComponentResponsiveContract {
  name: string;
  mobile: 'stack' | 'drawer' | 'card_list' | 'single_slot' | 'bottom_sheet';
  tablet: 'grid_2col' | 'compact_sidebar' | 'scroll_x' | 'modal_compact';
  desktop: 'grid_4col' | 'fixed_sidebar' | 'table_full' | 'modal_centered';
}

export class ComponentResponsiveEngine {
  private static contracts: Map<string, ComponentResponsiveContract> = new Map([
    [
      'DashboardStats',
      {
        name: 'DashboardStats',
        mobile: 'stack',
        tablet: 'grid_2col',
        desktop: 'grid_4col'
      }
    ],
    [
      'NavigationSidebar',
      {
        name: 'NavigationSidebar',
        mobile: 'drawer',
        tablet: 'compact_sidebar',
        desktop: 'fixed_sidebar'
      }
    ],
    [
      'DataTable',
      {
        name: 'DataTable',
        mobile: 'card_list',
        tablet: 'scroll_x',
        desktop: 'table_full'
      }
    ],
    [
      'FormGrid',
      {
        name: 'FormGrid',
        mobile: 'stack',
        tablet: 'grid_2col',
        desktop: 'grid_4col'
      }
    ],
    [
      'ModalDialog',
      {
        name: 'ModalDialog',
        mobile: 'bottom_sheet',
        tablet: 'modal_compact',
        desktop: 'modal_centered'
      }
    ]
  ]);

  public static getContract(componentName: string): ComponentResponsiveContract | undefined {
    return this.contracts.get(componentName);
  }
}
