// js/crud-api.js
class CrudAPI {
  constructor(base = '/compass/api/crud.php') { this.base = base; }
  async call(action, table, payload={}) {
    const res = await fetch(this.base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, table, payload })
    });
    if (!res.ok) throw new Error('Network error ' + res.status);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'API error');
    return json;
  }
  list(table, opts = {}) { return this.call('list', table, opts); }
  get(table, id) { return this.call('get', table, { id }); }
  create(table, record) { return this.call('create', table, { record }); }
  update(table, id, record) { return this.call('update', table, { id, record }); }
  remove(table, id) { return this.call('delete', table, { id }); }

  // Optional: update DataStore after server success
  async createAndSync(table, record) {
    const r = await this.create(table, record);
    if (window.DataStore && r.record) DataStore.create(table, r.record);
    return r;
  }
}
window.crudApi = new CrudAPI();