import React from 'react';

const mapNavigationStateParamsToProps = (SomeComponent, moreProps ={}) => {
  return class extends React.Component {
      static navigationOptions = SomeComponent.navigationOptions;
      render() {
          const {navigation: {state: {params}}} = this.props
          return <SomeComponent {...params} {...this.props} {...moreProps}/>
      }
  }
}

export default mapNavigationStateParamsToProps;