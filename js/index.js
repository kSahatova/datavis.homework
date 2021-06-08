const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let selected_country;

const x = d3.scaleLinear().range([margin*2, width-margin]); 
const y = d3.scaleLinear().range([height-margin, margin]); //in SVG y positions increase towards the bottom of the document


const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin]);


const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);


const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);


const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

const regions = ['africa', 'asia', 'europe', 'americas'];

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('change', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot(xParam, yParam, rParam);
        updateBarChart(param);
        
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScatterPlot(xParam, yParam, rParam);
    });

    d3.select('#x').on('change', function(){ 
        xParam = d3.select(this).property('value');
        updateScatterPlot(xParam, yParam, rParam);
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScatterPlot(xParam, yParam, rParam);
    });

    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateBarChart(param);
    });
    
    function updateScatterPlot(xParam, yParam, rParam){
        scatterPlot.selectAll("g").remove();

        
        x.domain(d3.extent(data, d => +d[xParam][year]));
        scatterPlot.append('g')
        .attr('transform', `translate(0, ${height - margin})`)
        .call(d3.axisBottom(x));

        
        y.domain(d3.extent(data, d => +d[yParam][year]));
        scatterPlot.append('g')
        .attr('transform', `translate(${margin*2}, 0)`)
        .call(d3.axisLeft(y));


        radiusScale.domain(d3.extent(data, d => +d[rParam][year]));
        
        scatterPlot
        .append('g')
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => (d[xParam]) ? x(+d[xParam][year]) : x(0))
        .attr("cy", d => (d[yParam]) ? y(+d[yParam][year]) : y(0))
        .attr("r", d => (d[rParam]) ? radiusScale(+d[rParam][year]) : radiusScale(0))
        .attr("fill", d => colorScale(d.region))
        .on('click', function (param_click) {
            selected_country = param_click.country
            console.log(selected_country)
            countryName.html(selected_country);
            
            updateLinearPlot(param);

            scatterPlot
            .selectAll("circle")
            .attr("stroke", 'black')
            .attr("stroke-width", d => d.country === selected_country ? 0.5: .0);


        });
    }

    function updateBarChart(param){
        barChart.selectAll("g").remove();        

        xBar.domain(regions);
        xBarAxis.call(d3.axisBottom(xBar));  
        
        yBar.domain(d3.extent(data, d => +d[param][year]));
        yBarAxis.call(d3.axisLeft(yBar));

        data_regs = []
        
        for (reg of regions)
        {
            data_regs.push({'reg': reg, 
            'value': d3.mean(data, function (d) { if (reg == d.region) return +d[param][year]})})
        }
        barChart.append('g')
        .selectAll(".bar")
        .data(data_regs)
        .enter().append("rect")
        .attr("x", d => xBar(d.reg))
        .attr("y", d => yBar(d.value)) 
        .style("fill", d => colorScale(d.reg) )
        .attr("width", xBar.bandwidth()) //x-scale returns a calculated bandwidth
        .attr("height", d => height - yBar(d.value) - margin) 
        .on('click', function (param_click) {
            console.log(param_click.reg)
            choiced_reg = param_click.reg
            barChart.selectAll('rect')
            .style('opacity', d => d.reg === choiced_reg ? 1.0: .2);
            
            scatterPlot
            .selectAll("circle")
            .style('opacity', d => d.region === choiced_reg ? 1.0: 0);
        })
        
        
    }

    function updateLinearPlot(param){
        lineChart.selectAll('g, path').remove();
        
        let country_cur = data.findIndex(d => d.country === selected_country)
        let xData = Object.keys(data[country_cur][param]).map(d => +d).slice(0, -5);
        let yData = Object.values(data[country_cur][param]).map(d => +d).slice(0, -5);
        
        x.domain(d3.extent(xData, d => d));
        lineChart.append('g')
        .attr('transform', `translate(0, ${height-margin})`)
        .call(d3.axisBottom(x));
        
        y.domain(d3.extent(yData));
        lineChart.append('g')
        .attr('transform', `translate(${margin*2}, 0)`)
        .call(d3.axisLeft(y));
        
        data_LP = []
    
        for (i of Array(xData.length).keys())
        {
            data_LP.push({'x': xData[i], 'y': yData[i]})
        }

        lineChart.append("path")
        .datum(data_LP)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
        .x(function (d) {return x(d.x)})
        .y(function (d) {return y(d.y)})
        );
        
    }
    
    
    updateScatterPlot(xParam, yParam, rParam);
    updateBarChart(param);
    updateLinearPlot(param);
});


async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}
