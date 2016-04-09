import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';

// chai.config.includeStack = true;
global.should = chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);
